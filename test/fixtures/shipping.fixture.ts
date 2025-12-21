export const mockShippingAddressId = 'shipping-123';
export const mockUserId = 'user-456';

export const mockShippingAddress = {
  id: mockShippingAddressId,
  userId: mockUserId,
  firstName: 'John',
  lastName: 'Doe',
  address1: '123 Main St',
  address2: null,
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'USA',
  phone: '+1234567890',
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockShippingAddressNonDefault = {
  id: 'shipping-456',
  userId: mockUserId,
  firstName: 'Jane',
  lastName: 'Smith',
  address1: '456 Oak Ave',
  address2: null,
  city: 'Los Angeles',
  state: 'CA',
  postalCode: '90001',
  country: 'USA',
  phone: '+0987654321',
  isDefault: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockShippingAddressList = [
  mockShippingAddress,
  mockShippingAddressNonDefault,
];

export const mockCreateShippingAddressDto = {
  firstName: 'John',
  lastName: 'Doe',
  address1: '123 Main St',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'USA',
  phone: '+1234567890',
  isDefault: true,
};

export const mockUpdateShippingAddressDto = {
  firstName: 'John Updated',
  phone: '+1111111111',
  isDefault: false,
};
