
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.PropertyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  pricePerMonth: 'pricePerMonth',
  securityDeposit: 'securityDeposit',
  applicationFee: 'applicationFee',
  cleaningFee: 'cleaningFee',
  photoUrls: 'photoUrls',
  amenities: 'amenities',
  highlights: 'highlights',
  isPetsAllowed: 'isPetsAllowed',
  isParkingIncluded: 'isParkingIncluded',
  beds: 'beds',
  baths: 'baths',
  squareFeet: 'squareFeet',
  propertyType: 'propertyType',
  postedDate: 'postedDate',
  averageRating: 'averageRating',
  numberOfReviews: 'numberOfReviews',
  locationId: 'locationId',
  managerId: 'managerId',
  status: 'status',
  images: 'images'
};

exports.Prisma.ManagerScalarFieldEnum = {
  id: 'id',
  supabaseId: 'supabaseId',
  name: 'name',
  email: 'email',
  phoneNumber: 'phoneNumber'
};

exports.Prisma.TenantScalarFieldEnum = {
  id: 'id',
  supabaseId: 'supabaseId',
  name: 'name',
  email: 'email',
  phoneNumber: 'phoneNumber'
};

exports.Prisma.LocationScalarFieldEnum = {
  id: 'id',
  address: 'address',
  city: 'city',
  state: 'state',
  country: 'country',
  postalCode: 'postalCode'
};

exports.Prisma.ApplicationScalarFieldEnum = {
  id: 'id',
  applicationDate: 'applicationDate',
  status: 'status',
  propertyId: 'propertyId',
  tenantId: 'tenantId',
  name: 'name',
  email: 'email',
  phoneNumber: 'phoneNumber',
  occupation: 'occupation',
  annualIncome: 'annualIncome',
  message: 'message',
  leaseId: 'leaseId'
};

exports.Prisma.LeaseScalarFieldEnum = {
  id: 'id',
  startDate: 'startDate',
  endDate: 'endDate',
  rent: 'rent',
  deposit: 'deposit',
  propertyId: 'propertyId',
  tenantId: 'tenantId'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  amountDue: 'amountDue',
  amountPaid: 'amountPaid',
  dueDate: 'dueDate',
  paymentDate: 'paymentDate',
  paymentStatus: 'paymentStatus',
  leaseId: 'leaseId'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.PropertyType = exports.$Enums.PropertyType = {
  Rooms: 'Rooms',
  Tinyhouse: 'Tinyhouse',
  Apartment: 'Apartment',
  Villa: 'Villa',
  Townhouse: 'Townhouse',
  Cottage: 'Cottage'
};

exports.PropertyStatus = exports.$Enums.PropertyStatus = {
  Available: 'Available',
  Rented: 'Rented',
  UnderMaintenance: 'UnderMaintenance',
  Inactive: 'Inactive'
};

exports.Amenity = exports.$Enums.Amenity = {
  WasherDryer: 'WasherDryer',
  AirConditioning: 'AirConditioning',
  Dishwasher: 'Dishwasher',
  HighSpeedInternet: 'HighSpeedInternet',
  HardwoodFloors: 'HardwoodFloors',
  WalkInClosets: 'WalkInClosets',
  Microwave: 'Microwave',
  Refrigerator: 'Refrigerator',
  Pool: 'Pool',
  Gym: 'Gym',
  Parking: 'Parking',
  PetsAllowed: 'PetsAllowed',
  WiFi: 'WiFi'
};

exports.Highlight = exports.$Enums.Highlight = {
  HighSpeedInternetAccess: 'HighSpeedInternetAccess',
  WasherDryer: 'WasherDryer',
  AirConditioning: 'AirConditioning',
  Heating: 'Heating',
  SmokeFree: 'SmokeFree',
  CableReady: 'CableReady',
  SatelliteTV: 'SatelliteTV',
  DoubleVanities: 'DoubleVanities',
  TubShower: 'TubShower',
  Intercom: 'Intercom',
  SprinklerSystem: 'SprinklerSystem',
  RecentlyRenovated: 'RecentlyRenovated',
  CloseToTransit: 'CloseToTransit',
  GreatView: 'GreatView',
  QuietNeighborhood: 'QuietNeighborhood'
};

exports.ApplicationStatus = exports.$Enums.ApplicationStatus = {
  Pending: 'Pending',
  Denied: 'Denied',
  Approved: 'Approved'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  Pending: 'Pending',
  Paid: 'Paid',
  PartiallyPaid: 'PartiallyPaid',
  Overdue: 'Overdue'
};

exports.Prisma.ModelName = {
  Property: 'Property',
  Manager: 'Manager',
  Tenant: 'Tenant',
  Location: 'Location',
  Application: 'Application',
  Lease: 'Lease',
  Payment: 'Payment'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
