import dayjs from 'dayjs';

export const formatAddress = (address) => {
  if (!address) {
    return null;
  }
  const formattedAddress =
    (address.line1 ? `${address.line1}\n` : '') +
    (address.line2 ? `${address.line2}\n` : '') +
    (address.line3 ? `${address.line3}\n` : '') +
    (address.city ? `${address.city}\n` : '') +
    (address.postCode ? `${address.postCode}\n` : '') +
    (address.country ? `${address.country}\n` : '');
  return formattedAddress;
};

export const formatCategory = (category) => {
  return category.slice(-1);
};

export const formatDate = (date) => {
  return dayjs(date).format('DD MM YYYY HH:mm');
};

export const formatPerson = (firstName, middleName, lastName, docNumber) => {
  const name =
    (firstName ? `${firstName} ` : '') +
    (middleName ? `${middleName} ` : '') +
    (lastName ? `${lastName}` : '') +
    (docNumber ? `, ${docNumber}` : '');
  return name;
};
