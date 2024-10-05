import {
  boldMessage,
  numberFormat,
  printColumnConsole,
} from "../../helpers/general";
import {
  IOrder,
  IProduct,
  IWarehouses,
  IErrorResult,
  IStoreCheckEnough,
  IListStockIsNotEnough,
  IProductsInWarehouses,
  IResultTheBestWarehouse,
  ITakeProductOutFromWarehouse,
} from "./interfaces/warehouse.interface";

class Warehouse {
  private warehouses: IWarehouses = {};
  private productsInWarehouse: IProductsInWarehouses = {};

  addProduct(warehouseName: string, product: IProduct) {
    const { name, price, stock } = product;

    if (!this.warehouses[warehouseName]) {
      this.warehouses[warehouseName] = {};
    }

    this.warehouses[warehouseName][name] = { price, stock };

    if (!this.productsInWarehouse[name]) {
      this.productsInWarehouse[name] = 0;
    }

    this.productsInWarehouse[name] += stock;
  }

  addProducts(warehouseName: string, products: IProduct[]) {
    products.map((product) => {
      this.addProduct(warehouseName, product);
    });
  }

  getWarehouses() {
    return this.warehouses;
  }

  private findOrderInWarehouse(order: IOrder) {
    const warehouseNames = Object.keys(this.warehouses);
    const bestWarehouse = [];
    const normalWarehouse = [];
    const bestWarehouseDetail = [];
    const normalWarehouseDetail = [];

    for (const warehouseName of warehouseNames) {
      const product = Object.keys(this.warehouses[warehouseName]).find(
        (item) => order.product.toString() === item.toString()
      );

      if (product) {
        const isEnough =
          order.quantity <= this.warehouses[warehouseName][product].stock;
        const haveInStock = this.warehouses[warehouseName][product].stock > 0;

        if (isEnough) {
          bestWarehouse.push(warehouseName);
          bestWarehouseDetail.push({
            warehouseName,
            price: this.warehouses[warehouseName][product].price,
            stock: this.warehouses[warehouseName][product].stock,
          });
        } else if (haveInStock) {
          normalWarehouse.push(warehouseName);
          normalWarehouseDetail.push({
            warehouseName,
            price: this.warehouses[warehouseName][product].price,
            stock: this.warehouses[warehouseName][product].stock,
          });
        }
      }
    }

    return {
      bestWarehouse,
      normalWarehouse,
      bestWarehouseDetail,
      normalWarehouseDetail,
    };
  }

  private validateIsNotEnoughProductInWarehouse(
    orders: IOrder[]
  ): IStoreCheckEnough {
    const productsIsNotEnough = orders.reduce(
      (store: IStoreCheckEnough, order) => {
        const isStockNotEnough =
          this.productsInWarehouse[order.product] - order.quantity < 0;
        if (store.isStockEnough && isStockNotEnough) {
          store.isStockEnough = false;
        }

        if (isStockNotEnough) {
          store.listStockIsNotEnough.push({
            product: order.product,
            inStock: this.productsInWarehouse[order.product],
            order: order.quantity,
          });
        }

        return store;
      },
      { isStockEnough: true, listStockIsNotEnough: [] }
    );

    return productsIsNotEnough;
  }

  private findTheBestWarehouse(
    orders: IOrder[]
  ): IResultTheBestWarehouse[] | IErrorResult {
    const { isStockEnough, listStockIsNotEnough } =
      this.validateIsNotEnoughProductInWarehouse(orders);

    if (!isStockEnough) {
      this.printStockIsNotEnough(orders, listStockIsNotEnough);
      return { error: true, message: "Stock is not enough" };
    }

    const ordersInWarehouses = orders.map((order) => {
      return {
        order,
        ordersInWarehouses: this.findOrderInWarehouse(order),
      };
    });

    let bestWarehouse = ordersInWarehouses[0].ordersInWarehouses.bestWarehouse;
    for (const o of ordersInWarehouses) {
      bestWarehouse = o.ordersInWarehouses.bestWarehouse.filter(
        (warehouseName) => bestWarehouse.includes(warehouseName)
      );
    }

    if (bestWarehouse.length > 0) {
      return ordersInWarehouses.map((o) => {
        return {
          order: o.order,
          wherehouses: [
            {
              name: bestWarehouse[0],
              productInStock: {
                ...this.warehouses[bestWarehouse[0]][o.order.product],
                stock: o.order.quantity,
              },
            },
          ],
        };
      });
    } else {
      return ordersInWarehouses.map((o) => {
        const { ordersInWarehouses } = o;
        const isEnoughInStock = ordersInWarehouses.bestWarehouse.length > 0;
        const warehouseName = ordersInWarehouses.bestWarehouse[0];
        const productName = o.order.product;
        const orderQuantity = o.order.quantity;

        if (isEnoughInStock) {
          return {
            order: o.order,
            wherehouses: [
              {
                name: warehouseName,
                productInStock: {
                  ...this.warehouses[warehouseName][productName],
                  stock: o.order.quantity,
                },
              },
            ],
          };
        }

        const wherehouses = ordersInWarehouses.normalWarehouseDetail.reduce(
          (store: any, wh) => {
            if (store.quantity > 0) {
              if (store.quantity - wh.stock > 0) {
                store.quantity -= wh.stock;
                store.warehouses.push({
                  name: wh.warehouseName,
                  productInStock:
                    this.warehouses[wh.warehouseName][productName],
                });
              } else {
                const quantity = store.quantity;
                store.quantity -= quantity;
                store.warehouses.push({
                  name: wh.warehouseName,
                  productInStock: {
                    ...this.warehouses[wh.warehouseName][productName],
                    stock: quantity,
                  },
                });
              }
            }

            return store;
          },
          { quantity: orderQuantity, warehouses: [] }
        );

        return {
          order: o.order,
          wherehouses: wherehouses.warehouses,
        };
      });
    }
  }

  private takeProductOutFromWarehouse({
    warehouse,
    product,
    quantity,
  }: ITakeProductOutFromWarehouse) {
    this.warehouses[warehouse][product].stock -= quantity;
    this.productsInWarehouse[product] -= quantity;
  }

  processOrder(orders: IOrder[]) {
    const data: any = this.findTheBestWarehouse(orders);

    if (data.error) {
      return data;
    }

    const takeOutOfWarehouseData = JSON.parse(JSON.stringify(data));

    data.map((d: any) => {
      d.wherehouses.map((w: any) => {
        this.takeProductOutFromWarehouse({
          warehouse: w.name,
          product: d.order.product,
          quantity: w.productInStock.stock,
        });
      });
    });

    this.logProductOutFromWarehouse(orders, takeOutOfWarehouseData);

    return data;
  }

  private logProductOutFromWarehouse(
    orders: IOrder[],
    data: IResultTheBestWarehouse[]
  ) {
    const message = orders.reduce((store: string, o) => {
      store += `${o.product} ${o.quantity} units \n`;
      return store;
    }, "");

    const details = data.reduce((store, d) => {
      d.wherehouses.map((wh) => {
        store += `Take ${boldMessage(
          wh.productInStock.stock.toString()
        )} ${boldMessage(d.order.product)} out of ${boldMessage(
          wh.name
        )} (Price: ${boldMessage(
          numberFormat(wh.productInStock.price)
        )} / unit) \n`;
      });

      return store;
    }, "");

    const summary = data.reduce(
      (store, d) => {
        d.wherehouses.map((wh) => {
          store.message += `${boldMessage(d.order.product)} (${boldMessage(
            wh.name
          )}) ${boldMessage(
            wh.productInStock.stock.toString()
          )} x ${boldMessage(
            numberFormat(wh.productInStock.price)
          )} = ${boldMessage(
            numberFormat(wh.productInStock.stock * wh.productInStock.price)
          )}\n`;

          store.total += wh.productInStock.stock * wh.productInStock.price;
        });

        return store;
      },
      { message: "", total: 0 }
    );

    console.log(`===================== Order ====================\n`);
    console.log(message);
    console.log(`Details:`);
    console.log(details);
    console.log("Summary:");
    console.log(summary.message);
    console.log(
      `${boldMessage("Total")}: ${boldMessage(numberFormat(summary.total))}`
    );
    console.log(`\n|===============================================|\n\n`);
  }

  printWarehousesInformation() {
    console.log(`================ All Warehouses ================`);
    console.log(`\n`);
    Object.keys(this.warehouses).map((warehouseName) => {
      console.log(`|===============================================|`);
      console.log(`| Warehouse: ${printColumnConsole(warehouseName, 35)}|`);
      console.log(`|===============================================|`);
      console.log(
        `| ${printColumnConsole("Name")}| ${printColumnConsole(
          "Price"
        )}| ${printColumnConsole("Sotck")}|`
      );
      console.log(`|-----------------------------------------------|`);

      Object.keys(this.warehouses[warehouseName]).map((productName) => {
        const { stock, price } = this.warehouses[warehouseName][productName];
        console.log(
          `| ${printColumnConsole(productName)}| ${printColumnConsole(
            numberFormat(price)
          )}| ${printColumnConsole(numberFormat(stock))}|`
        );
      });
      console.log(`|===============================================|`);
      console.log(`\n`);
    });

    console.log("================================================");
  }

  printStockIsNotEnough(
    orders: IOrder[],
    listStockIsNotEnough: IListStockIsNotEnough[]
  ) {
    const message = orders.reduce((store: string, o) => {
      store += `${o.product} ${o.quantity} units \n`;
      return store;
    }, "");

    const details = listStockIsNotEnough.reduce((store, d) => {
      store += `The number of ${boldMessage(
        d.product
      )} in stock is not enough to fulfill the order are not enough \n`;
      store += `Your order: ${boldMessage(numberFormat(d.order))}\n`;
      store += `In Stock: ${boldMessage(numberFormat(d.inStock))}`;

      return store;
    }, "");

    console.log("\n");
    console.log(`================== Order Error ! ================|\n`);
    console.log(message);
    console.log(`Details:`);
    console.log(details);
    console.log("=================================================|");
    console.log("\n");
  }
}

export default Warehouse;
