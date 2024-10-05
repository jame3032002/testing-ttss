interface IWarehouses {
  [key: string]: {
    [name: string]: {
      price: number;
      stock: number;
    };
  };
}

interface IProduct {
  name: string;
  price: number;
  stock: number;
}

interface IOrder {
  product: string;
  quantity: number;
}

interface IProductsInWarehouses {
  [product: string]: number;
}

interface ITakeProductOutFromWarehouse {
  warehouse: string;
  product: string;
  quantity: number;
}

interface IResultTheBestWarehouse {
  order: IOrder;
  wherehouses: {
    name: string;
    productInStock: {
      price: number;
      stock: number;
    };
  }[];
}

interface IErrorResult {
  error: boolean;
  message: string;
}

interface IListStockIsNotEnough {
  product: string;
  inStock: number;
  order: number;
}

interface IStoreCheckEnough {
  isStockEnough: boolean;
  listStockIsNotEnough: IListStockIsNotEnough[];
}

export {
  IOrder,
  IProduct,
  IWarehouses,
  IErrorResult,
  IStoreCheckEnough,
  IProductsInWarehouses,
  IListStockIsNotEnough,
  IResultTheBestWarehouse,
  ITakeProductOutFromWarehouse,
};
