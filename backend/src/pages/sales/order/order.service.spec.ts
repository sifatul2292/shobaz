import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '../../../enum/order.enum';
import { OrderService } from './order.service';

jest.mock('axios', () => ({
  __esModule: true,
  default: {},
}));

describe('OrderService.sendOrderToCourier', () => {
  const makeService = (order: any) => {
    const service = Object.create(OrderService.prototype) as OrderService;
    const select = jest.fn().mockResolvedValue({
      courierMethods: [
        { providerName: 'MetroWings Courier', status: 'active' },
      ],
    });
    const orderModel = {
      findById: jest.fn().mockResolvedValue(order),
      findByIdAndUpdate: jest.fn().mockResolvedValue(order),
    };

    (service as any).settingModel = { findOne: jest.fn(() => ({ select })) };
    (service as any).orderModel = orderModel;
    (service as any).addSingleOrderToCourier = jest
      .fn()
      .mockResolvedValue(undefined);

    return { service, orderModel };
  };

  it('marks the order Completed only after courier tracking is persisted', async () => {
    const { service, orderModel } = makeService({
      courierData: {
        providerName: 'MetroWings Courier',
        consignmentId: 'F0721TEST',
      },
    });

    const response = await service.sendOrderToCourier('order-id');

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith('order-id', {
      $set: { orderStatus: OrderStatus.DELIVERED },
    });
    expect(response.success).toBe(true);
    expect(response.data.orderStatus).toBe(OrderStatus.DELIVERED);
  });

  it('does not change status when the courier response has no reference', async () => {
    const { service, orderModel } = makeService({ courierData: null });

    await expect(service.sendOrderToCourier('order-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(orderModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('does not change status when courier submission throws', async () => {
    const { service, orderModel } = makeService({ courierData: null });
    (service as any).addSingleOrderToCourier.mockRejectedValue(
      new Error('Courier unavailable'),
    );

    await expect(service.sendOrderToCourier('order-id')).rejects.toThrow(
      'Courier unavailable',
    );
    expect(orderModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe('OrderService.updateIncompleteOrderById', () => {
  it('updates editable order details without allowing conversion fields', async () => {
    const service = Object.create(OrderService.prototype) as OrderService;
    const savedOrder = { _id: 'incomplete-id', name: 'Updated customer' };
    const findByIdAndUpdate = jest.fn().mockResolvedValue(savedOrder);
    (service as any).incompleteOrderModel = { findByIdAndUpdate };

    const response = await service.updateIncompleteOrderById('incomplete-id', {
      name: 'Updated customer',
      grandTotal: 499,
      orderedItems: [{ _id: 'product-id', quantity: 1, unitPrice: 439 }],
      status: 'converted',
      orderId: 'forged-order-id',
    });

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'incomplete-id',
      {
        $set: {
          name: 'Updated customer',
          grandTotal: 499,
          orderedItems: [
            { _id: 'product-id', quantity: 1, unitPrice: 439 },
          ],
        },
      },
      { new: true, runValidators: true },
    );
    expect(response).toEqual({
      success: true,
      message: 'Updated',
      data: savedOrder,
    });
  });
});

describe('OrderService incomplete-order item compatibility', () => {
  it('normalizes legacy string discount types for the admin add path', () => {
    const service = Object.create(OrderService.prototype) as OrderService;

    const result = (service as any).normalizeOrderedItemDiscountTypes([
      { _id: 'cash-product', discountType: 'CASH' },
      { _id: 'percentage-product', discountType: 'PERCENTAGE' },
      { _id: 'numeric-product', discountType: 2 },
    ]);

    expect(result[0].discountType).toBe(2);
    expect(result[1].discountType).toBe(1);
    expect(result[2].discountType).toBe(2);
  });

  it('normalizes items before addOrderAdmin constructs the order document', async () => {
    const service = Object.create(OrderService.prototype) as OrderService;
    const save = jest.fn().mockResolvedValue({
      _id: 'created-order-id',
      orderId: '000001',
      orderedItems: [],
    });
    const orderModel = jest.fn().mockImplementation(() => ({ save }));
    (service as any).logger = { error: jest.fn(), warn: jest.fn() };
    (service as any).adminModel = {
      findById: jest.fn().mockResolvedValue({ _id: 'admin-id' }),
    };
    (service as any).uniqueIdModel = {
      findOneAndUpdate: jest.fn().mockResolvedValue({ orderId: 1 }),
    };
    (service as any).utilsService = {
      padLeadingZeros: jest.fn().mockReturnValue('000001'),
      getDateMonth: jest.fn().mockReturnValue(7),
      getDateYear: jest.fn().mockReturnValue(2026),
    };
    (service as any).userModel = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    (service as any).orderModel = orderModel;
    (service as any).productModel = {
      findById: jest.fn().mockResolvedValue({ quantity: 0 }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    };
    (service as any).notifySgtmPanelOrder = jest.fn();
    (service as any).cleanupIncompleteOrdersForPlacedOrder = jest
      .fn()
      .mockResolvedValue(undefined);
    (service as any).processOrderBackgroundTasks = jest
      .fn()
      .mockResolvedValue(undefined);

    await service.addOrderAdmin(
      { _id: 'admin-id' },
      {
        name: 'Customer',
        phoneNo: '01700000000',
        shippingAddress: 'Dhaka',
        orderedItems: [
          {
            _id: 'product-id',
            quantity: 1,
            discountType: 'CASH',
          },
        ],
      } as any,
    );

    expect(orderModel.mock.calls[0][0].orderedItems[0].discountType).toBe(2);
  });
});
