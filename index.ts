import Warehouse from "./src/features/warehouse";

import {
  mockDataWarehouse1,
  mockDataWarehouse2,
  mockDataWarehouse3,
} from "./__mock__/warehouses";
import { mockOrder1, mockOrder2 } from "./__mock__/orders";


async function main() {
  const warehouse = new Warehouse();

  warehouse.addProducts("WH1", mockDataWarehouse1);
  warehouse.addProducts("WH2", mockDataWarehouse2);
  warehouse.addProducts("WH3", mockDataWarehouse3);

  warehouse.printWarehousesInformation();
  warehouse.processOrder(mockOrder1);
  warehouse.processOrder(mockOrder2);
  warehouse.printWarehousesInformation();
}

main();
