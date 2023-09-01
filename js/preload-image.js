import loadImage from './utils/load-image.js'

export default function(people){
    let i = 0;

    const next = () => {
        const url = people[i].digit_album_img;
        loadImage(url, () => {
            i += 1;
            if (i < people.length) next();
            else console.log('done preloading images');
        })
    }

    next()
}