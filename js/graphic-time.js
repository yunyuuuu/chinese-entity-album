import 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.2/d3.min.js';
import 'https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.21/lodash.js';
import cleanData from './clean-data.js';
import tooltip from './tooltip.js';

let singerData = null;
let radialAxis = null;
let zoomData = null;
let width = 0;
let height = 0;
let max_r = 0;
let innerRadius = 0;
let outerRadius = 0;
let radius = 0;
let diff_rec = null;
let angle1 = 0;
let angle2 = 0;
let innerHeight = 0;

const MARGIN = { top: 20, bottom: 40, left: 20, right: 20 };

const $section = d3.select('#time');
const $figure = $section.select('.figure--chart');
const $svg = $figure.select('svg');
const $svg_g = $svg.append('g');
const barChart = $svg_g.append('g').attr('class', 'bar');
const rAxis = $svg_g.append('g').attr('class', 'r axis');
const $anno = $svg_g.append('g').attr('class', 'g-annotations');
const $zoom = $svg_g.append('g').attr('class', 'g-zoom');
const $tips = $svg_g.append('g').attr('class', 'color-tip');

let $tip = null;

const singerType = ['大陆歌手', '组合成员', '台湾歌手', '合作歌手', '乐队', '组合', '香港歌手', '其他', '虚拟歌手', 'rapper'];
const color2 = d3.scaleOrdinal()
    .range(['#00429d', '#3e67ae', '#618fbf', '#85b7ce', '#b1dfdb', '#ffcab9', '#fd9291', '#e75d6f', '#c52a52', '#93003a'])
    .domain(singerType);

function handleMouseEnter() {
    $zoom.select('.zoom').classed('is-show', true);
    $zoom.select('.zoom-bar').classed('is-show', true);
    $zoom.select('.tipLine').classed('is-show', true);
};

function handleMouseExit() {
    $zoom.select('.zoom').classed('is-show', false);
    $zoom.select('.zoom-bar').classed('is-show', false);
    $zoom.select('.tipLine').classed('is-show', false);
};

function handleNameEnter(d){
    const datum = d.toElement.__data__;
    const m = d3.pointer(event)
    const [x, y] = d3.pointer(event, this.parentNode.parentNode.parentNode);
    const pos = { x: `${x}`, y: `${y}` };
    tooltip.show({ el: $tip, d: datum, pos })
    d3.select(d.toElement).classed('is-scale', true)
}

function handleNameEnter2(d){
    const datum = d.toElement.__data__;
    const m = d3.pointer(event)
    const [x, y] = d3.pointer(event, this.parentNode.parentNode.parentNode.parentNode);
    const pos = { x: `${x}`, y: `${y}` };
    tooltip.show({ el: $tip, d: datum, pos });
    const className = d.toElement.className.baseVal;
    $zoom.select('.zoom-bar').select(`.${className}`).classed('is-scale2', true)
    handleMouseEnter();
}

function updateDimensions() {
    innerHeight = window.innerHeight;
    innerWidth = $section.node().offsetWidth;

    width = innerWidth;
    max_r = innerHeight <= width ? innerHeight : width;
    height = innerHeight > width ? max_r : innerHeight;
}

function resize() {
    updateDimensions();

    $figure
        .style('height', `${height}px`)
        .style('top', `${20}px`)

    //大圆半径

    $svg.attr('width', width)
        .attr('height', height);

    $svg_g.attr('transform', `translate(${width * 0.45}, ${height * 0.6})`)

    innerRadius = max_r * 0.1;
    outerRadius = max_r * 0.7
    radius = 0.1 * Math.PI

    const x = d3.scaleBand().range([2 * radius, 2 * Math.PI]).align(0).domain(singerData.map(d => d.album))
    const y = d3.scaleRadial().range([innerRadius, outerRadius]).domain([0, d3.max(singerData, d => d.dif_abs)]);

    barChart
        .selectAll("path")
        .classed('is-negetive', d => d.diff < 0)
        .attr("fill", d => color2(d.identity))
        .attr('d', d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(d => {
                if (d.dif_abs == 0) {
                    return (y(0.3))
                } else {
                    return y(d.dif_abs)
                }
            })
            .startAngle(d => x(d.album))
            .endAngle(d => x(d.album) + x.bandwidth())
            .padAngle(0.01)
            .padRadius(innerRadius))

    radialAxis = rAxis.selectAll('g')

    radialAxis.selectAll('circle')
        .attr('r', d => y(d))
        .attr('fill', 'none')
        .style('stroke', 'white');

    radialAxis
        .selectAll('text')
        .attr('x', d => y(d) * Math.sin(radius * 360 / 180))
        .attr('y', d => -y(d) * Math.cos(radius * 360 / 180))
        .style('text-anchor', 'end')
        .text(d => {
            if(d == 0){
                return `${d}天`
            }else{
                return `±${d}`
            }
        })

    // zoom area
    angle1 = x(zoomData[0].album);
    angle2 = x(zoomData[zoomData.length - 1].album) + x.bandwidth();

    const dot1 = { 'x': y(-0.5) * Math.sin(angle1), 'y': -y(-0.5) * Math.cos(angle1) };
    const dot2 = { 'x': y(-0.5) * Math.sin(angle2), 'y': -y(-0.5) * Math.cos(angle2) };
    const dot3 = { 'x': y(diff_rec + 0.5) * Math.sin(angle2), 'y': -y(diff_rec + 0.5) * Math.cos(angle2) };
    const dot4 = { 'x': y(diff_rec + 0.5) * Math.sin(angle1), 'y': -y(diff_rec + 0.5) * Math.cos(angle1) };

    $zoom
        .select('.zoom')
        .attr('d', `M ${dot1.x} ${dot1.y} A ${y(-0.5)} ${y(-0.5)} 0 0 1 ${dot2.x} ${dot2.y} L ${dot3.x} ${dot3.y} A ${y(diff_rec + 0.5)} ${y(diff_rec + 0.5)} 0 0 0 ${dot4.x} ${dot4.y} Z`)
    // .attr('fill', 'none').attr('stroke', '#aaa')

    $zoom
        .select('.zoom-bar')
        .attr('transform', 'scale(2.8)translate(10, 10)')

    $zoom
        .selectAll('.zoom-bar')
        .selectAll('path')
        .attr('class', d=>`index${d.index}`)
        .attr("fill", d => color2(d.identity))
        .attr('d', d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(d => {
                if (d.dif_abs == 0) {
                    return (y(0.4))
                } else {
                    return y(d.dif_abs)
                }
            })
            .startAngle(d => x(d.album))
            .endAngle(d => x(d.album) + x.bandwidth())
            .padAngle(0.01)
            .padRadius(innerRadius))

    $zoom
        .selectAll('.zoom-bar2')
        .selectAll('path')
        .attr('class', d=>`index${d.index}`)
        .attr("fill", 'transparent')
        .attr('d', d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(d => {
                if (d.dif_abs <= 1) {
                    return (y(3))
                } else {
                    return y(d.dif_abs)
                }
            })
            .startAngle(d => x(d.album))
            .endAngle(d => x(d.album) + x.bandwidth())
            .padAngle(0.01)
            .padRadius(innerRadius))

    $zoom
        .select('.tipLine')
        .attr('x1', y(diff_rec + 3) * Math.sin(x(zoomData[13].album)))
        .attr('x2', y(25) * Math.sin(x(zoomData[13].album)))
        .attr('y1', -y(diff_rec + 3) * Math.cos(x(zoomData[13].album)))
        .attr('y2', y(25) * Math.sin(x(zoomData[13].album)))
        .attr('stroke', '#aaa')

    $tips.attr('transform', `translate(${-max_r / 3.5}, ${-max_r / 2})`)

    $tips
        .selectAll('rect')
        .attr('transform', `translate(0, ${-innerRadius * 0.12})`)
        .attr('fill', d => color2(d))
        .attr('width', innerRadius * 0.24)
        .attr('height', innerRadius * 0.12)
        .attr('rx', innerRadius * 0.05)
        .attr('ry', innerRadius * 0.05)
        .attr('y', d => singerType.indexOf(d) * innerRadius * 0.3)

    $tips
        .selectAll('text')
        .attr('x', innerRadius * 0.24 * 1.5)
        .attr('y', d => singerType.indexOf(d) * innerRadius * 0.3)
        .text(d => d)

    // $zoom.append("g")
    //     .attr('transform', 'scale(2.8)translate(10, 10)')
    //     .selectAll("g")
    //     .data(zoomData)
    //     .join("g")
    //     .attr("text-anchor", function (d) { return (x(d.album) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
    //     .attr("transform", function (d) { return "rotate(" + ((x(d.album) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")" + "translate(" + (y(d['dif_abs']) + 2) + ",0)"; })
    //     .append("text")
    //     .text(function (d) { return (d.dif_abs) })
    //     .attr("transform", function (d) { return (x(d.album) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
    //     .style("font-size", "4px")
    //     .attr("alignment-baseline", "middle")

    if (max_r > 520) {
        handleMouseExit()
        $zoom.select('.zoom')
            .on('mouseenter', handleMouseEnter)
            .on('mouseleave', handleMouseExit);

        barChart
            .selectAll('path')
            .on('mouseenter', handleNameEnter)
            .on('mouseleave', () => {
                tooltip.hide($tip);
                barChart.selectAll('path.is-scale').classed('is-scale', false);
            });

        $zoom
            .select('.zoom-bar2')
            .selectAll('path')
            .on('mouseenter', handleNameEnter2)
            .on('mouseleave', () => {
                tooltip.hide($tip);
                $zoom.selectAll('path.is-scale2').classed('is-scale2', false);
            });
    } else {
        handleMouseEnter();
    }

};

function setupChart() {
    // singerData.sort(function (a, b) {
    //     // range is flipped, so it ascends from bottom of chart
    //     if (a.identity == b.identity) {
    //         return d3.descending(+a.dif_abs, +b.dif_abs);
    //     }
    //     return d3.ascending(a.identity, b.identity);
    // })
    singerData.sort(function (a, b) {
        return d3.descending(+a.dif_abs, +b.dif_abs);
    });

    barChart
        .selectAll("path")
        .data(singerData)
        .join("path")

    const axisData = [0, 10, 25, 50, 100, 150, 200, 250, 300, 350, 400]

    radialAxis = rAxis
        .selectAll('g')
        .data(axisData)
        .enter()
        .append('g');

    radialAxis.append('circle')

    radialAxis
        .append('text')

    // $svg_g.append("g")
    //     .selectAll("g")
    //     .data(singerData)
    //     .join("g")
    //     .attr("text-anchor", function (d) { return (x(d.album) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
    //     .attr("transform", function (d) { return "rotate(" + ((x(d.album) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")" + "translate(" + (y(d['dif_abs']) + 2) + ",0)"; })
    //     .append("text")
    //     .text(function (d) { return (d.entity_album) })
    //     .attr("transform", function (d) { return (x(d.album) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
    //     .style("font-size", "4px")
    //     .attr("alignment-baseline", "middle")

    // zoom area
    zoomData = singerData.filter(d => d.dif_abs < 7)
    diff_rec = zoomData[0].dif_abs

    $zoom
        .append('path')
        .attr('class', 'zoom')

    $zoom
        .append('g')
        .attr('class', 'zoom-bar')

    $zoom
        .append('g')
        .attr('class', 'zoom-bar2')

    $zoom
        .select('.zoom-bar')
        .selectAll("path")
        .data(zoomData)
        .join("path")

    $zoom
        .select('.zoom-bar2')
        .selectAll("path")
        .data(zoomData)
        .join("path")

    $zoom.append('line').attr('class', 'tipLine')

    // $zoom.append("g")
    //     .attr('transform', 'scale(2.8)translate(10, 10)')
    //     .selectAll("g")
    //     .data(zoomData)
    //     .join("g")
    //     .attr("text-anchor", function (d) { return (x(d.album) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
    //     .attr("transform", function (d) { return "rotate(" + ((x(d.album) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")" + "translate(" + (y(d['dif_abs']) + 2) + ",0)"; })
    //     .append("text")
    //     .text(function (d) { return (d.dif_abs) })
    //     .attr("transform", function (d) { return (x(d.album) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
    //     .style("font-size", "4px")
    //     .attr("alignment-baseline", "middle")

    $tips.selectAll('g').data(singerType).join('g');

    $tips.selectAll('g').append('text')
    $tips.selectAll('g').append('rect')

};

function setupTooltip() {
    $tip = tooltip.init({ container: $section });
    barChart.on('mouseleave', () => {
        tooltip.hide($tip)
    })
};

function loadData(singer) {
    return new Promise((resolve, reject) => {
        singerData = singer.filter(d => d.entity == true).map(d => ({
            ...d,
            dif_abs: Math.abs(d.diff)
        }))
        resolve();
    })
};

// lode data
function init(singer) {
    loadData(singer).then(() => {
        updateDimensions();
        setupChart();
        resize();
        setupTooltip();
    });
};


export default { init, resize };