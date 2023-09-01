export default function convertTimestampToDate(timestamp) {
    const arr = timestamp.split('/')
    const year = arr[0];
    const month = +arr[1] - 1;
    const date = arr[2];
    return new Date(year, month, date);
};
