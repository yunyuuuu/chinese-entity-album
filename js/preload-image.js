import loadImage from './utils/load-image.js'

export default function(people){
    let i = 0;

    const next = () => {
        const url = `./img/entity/${people[i].index}.webp`;
        const url2 = `./img/digit/${people[i].index}.webp`;
        if (people[i].enitity == 1){
            loadImage(url, () => {
                // i += 1;
                if (i < people.length) next();
                else console.log('done preloading images');
            })
        }
        loadImage(url2, () => {
            i += 1;
            if (i < people.length) next();
            else console.log('done preloading images');
        })
    }

    next()
}
