import 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.2/d3.min.js';

const MARGIN = 175;

function getPos({ el, pos }) {
    el.style('top', pos.y).style('left', pos.x);
    const { top, bottom, left, right } = el.node().getBoundingClientRect();

    const topDiff = top;
    const t = topDiff < 0 ? topDiff : 0;

    const className = {
        right: false,
        bottom: false,
    };

    if (bottom < 150) className.bottom = true;

    if (right > window.innerWidth - MARGIN) {
        className.right = true;
    }

    return { top: +pos.y + +t, className }
}

function hide(el) {
    el.classed('is-visible', false)
}

function show({ el, d, pos }) {

    // content
    el.select('.name').text(d.entity_album)
    el.select('.thumbnail').attr('src', `./img/entity/${d.index}.webp`).attr('onerror', "this.style.display='none'").attr('style', "display='block'");
    el.select('.bio').html(function(){
        if(d.diff < 0){
            return `<p>实体专辑发布于数字专辑<strong>${d.dif_abs}天前</strong></p>`
        }else if(d.diff == 0){
            return `<p>实体专辑与数字专辑于<strong>同一天</strong>发售</p>`
        }else{
            return `<p>实体专辑发布于数字专辑<strong>${d.dif_abs}天后</strong></p>`
        }
    })

    const { top, className } = getPos({ el, pos });
    const left = pos.x

    el.style('top', `${pos.y}px`).style('left', `${pos.x}px`)
        .classed('is-visible', true)
        .classed('is-right', className.right)
        .classed('is-bottom', className.bottom)

}

function init({ container }) {
    const tip = container.append('div').attr('class', 'tooltip');

    const $info = tip.append('div').attr('class', 'info');

    $info.append('img').attr('class', 'thumbnail');

    $info.append('p').attr('class', 'name');

    $info.append('div').attr('class', 'bio');

    return tip;
}

export default { init, show, hide }