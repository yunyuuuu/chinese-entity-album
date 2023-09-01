import convertTimestampToDate from './convert-timestamp-to-date.js'

function singer(data) {
    const clean = data.map((d, i) => ({
        ...d,
        index: d.index,

        album:d.album,
        singer:d.singer,
        identity: d.identity,

        digit_date:convertTimestampToDate(d.digit_date),
        digit_year: d.digit_date.substring(0, 4),
        digit_album_img: d.digit_album_img,
        price: +d.price,
        sales_volumn: +d.sales_volumn,
        digit_date2: d.digit_date,
        song_number: +d.song_number,

        entity: !!d.entity_album_date,
        entity_album: d.entity_album,
        entity_album_date: d.entity_album_date,
        entity_price: +d.entity_price,
        entity_type: d.entity_type,
        entity_img: d.entity_img,
        entity_thing: d.entity_thing.split('/'),

        diff: +d.diff
    }));
    return clean
}

export default{ singer }