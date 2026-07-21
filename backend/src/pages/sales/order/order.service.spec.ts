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
