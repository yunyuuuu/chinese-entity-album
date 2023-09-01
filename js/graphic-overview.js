import 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.2/d3.min.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/scrollama/3.2.0/scrollama.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/stickyfill/2.1.0/stickyfill.min.js';
import cleanData from './clean-data.js';
// import 'https://cdn.jsdelivr.net/npm/d3-delaunay@6';

const d3 = window.d3;

const MARGIN = { top: 20, bottom: 20, left: 20, right: 20 };
const SEC = 1000;
const DURATION = SEC * 3;

let singerData = null;
let arcs = null;
let hoverEnabled = false;
let currentStep = 'title';
let width = 0;
let height = 0;
let innerHeight = 0;
let innerWidth = 0;
let secPad = 0;
let max_r = 0;
let arti_width = 0

let arcMinRadius = 0;
let arcPadding = 0;
let labelPadding = 0;
let chartRadius = 0;
let diameter = 0
let FONT_SIZE = 0;

const $section = d3.select('#overview');
const $article = $section.select('article');
const $step = $article.selectAll('.step');
const $figure = $section.select('.scroll__figure');
const $chart = $figure.select('.figure__chart');
const $svg = $chart.select('svg.main');
const svg_g = $svg.append('g')
let vinyl = d3.select('vinyl')
let album_data = svg_g.append('g').attr('class', 'album_data')
let innerCircle = svg_g.append('g').attr('class', 'innerCircle')
let vorCircle = svg_g.append('g').attr('class', 'vorCircle')
let axis = svg_g.append('g').attr('class', 'axis')
const $tooltip = svg_g.append('g').attr('class', 'tooltip')
const defs = $tooltip.append('defs')
let defs_circle = defs.append('circle').attr('id', 'circle')
defs.append('clipPath').attr('id', 'circle-clip').append('use').attr('xlink:href', '#circle');
let album_img = $tooltip.append('image').attr('class', 'album_img');
let album_singer = $tooltip.append('text').attr('class', 'album_singer')
let album_date = $tooltip.append('text').attr('class', 'album_date');
let album_name = $tooltip.append('text').attr('class', 'album_name');

const PI = Math.PI;

// const $chart = $figure.select('.figure__chart');

const scroller = scrollama();
const scrollerHover = scrollama();

const singerType = ['大陆歌手', '组合成员', '台湾歌手', '合作歌手', '乐队', '组合', '香港歌手', '其他', '虚拟歌手', 'rapper'];
const color2 = d3.scaleOrdinal()
    .range(['#00429d', '#3e67ae', '#618fbf', '#85b7ce', '#b1dfdb', '#ffcab9', '#fd9291', '#e75d6f', '#c52a52', '#93003a'])
    .domain(singerType);

function exitYear($singer, dur) {
    $singer
        // .exit()
        .transition()
        .duration(dur)
        .style('opacity', 0)
        .remove()
}

function getInnerRadius(index, numArcs, arcWidth) {
    return arcMinRadius + (numArcs - (index + 1)) * (arcWidth + arcPadding);
}

function getOuterRadius(index, numArcs, arcWidth) {
    return getInnerRadius(index, numArcs, arcWidth) + arcWidth;
}

function getDuration({ leave, reverse }) {
    let factor = 1;
    if (leave) factor = 0;
    else if (reverse) factor = 0.33;
    const slow = DURATION * factor;
    const medium = Math.floor(slow * 0.33);
    const fast = Math.floor(slow * 0.1);
    return {
        slow,
        medium,
        fast
    };
}

// step render
const STEP = {
    'title': ({ reverse, leave, currentStep }) => {
        const dur = getDuration({ leave, reverse })

        const nested = d3.groups(singerData, d => d.digit_year)
            .map(d => ({
                key: +d[0],
                values: d[1],
                len: d[1].length
            })).sort(function (a, b) { return b.key - a.key });

        // const color = d3.scaleOrdinal(d3.schemeCategory10);

        let scale = d3.scaleLinear()
            .domain([0, d3.max(nested, d => d.len) * 1.1])
            .range([0, 2 * PI]);

        let keys = nested.map((d, i) => d.key);
        //number of arcs
        let numArcs = keys.length;
        let arcWidth = (chartRadius - arcMinRadius - numArcs * arcPadding) / numArcs;

        // circle
        const data = { a: 99, b: 428 }

        const color = d3.scaleOrdinal()
            .range(["#fe8b71", "#fd4a21"])

        const pie = d3.pie().value(function (d) { return d[1] })
        const data_ready = pie(Object.entries(data))

        innerCircle.selectAll('.vinyl').remove()
        innerCircle
            .selectAll('path')
            .data(data_ready)
            .enter()
            .append('path')
            .attr('calss', 'circle')
            .attr('d', d3.arc()
                .innerRadius(getInnerRadius(11, numArcs, arcWidth) * 0.2)
                .outerRadius(getOuterRadius(11, numArcs, arcWidth) * 1.1)
            )
            .attr('fill', function (d) { return (color(d.data[1])) })

        // innerCircle.append('text').text('18.78%付费数字专辑出了实体专辑') ANNOTATION or not

        let arc = d3.arc()
            .innerRadius((d, i) => getInnerRadius(i, numArcs, arcWidth))
            .outerRadius((d, i) => getOuterRadius(i, numArcs, arcWidth))
            .startAngle(0)
            .endAngle((d, i) => scale(d))

        axis.selectAll('text').remove()
        axis
            .selectAll('text')
            .data(nested)
            .enter()
            .append('text')
            .attr('x', labelPadding)
            .attr('y', (d, i) => -getOuterRadius(i, numArcs, arcWidth) + arcPadding * 4)
            .text(d => `${d.key}`);

        album_data.selectAll('g.year').remove()
        //data arcs
        let arcs = album_data
            .selectAll('path')
            .data(nested)
            .enter()
            .append('path')
            .attr('class', 'arc')
            .style('fill', '#444')

        arcs.transition()
            .delay((d, i) => i * 200)
            .duration(1000)
            .attrTween('d', arcTween);

        // arcs.on('mousemove', showTooltip)
        // arcs.on('mouseout', hideTooltip)

        function arcTween(d, i) {
            let interpolate = d3.interpolate(0, d.len);
            return t => arc(interpolate(t), i);
        }

        // function showTooltip(d) {
        //     const [x, y] = d3.pointer(event, this.parentNode.parentNode.parentNode);
        //     tooltip.style('left', (d.pageX + 10) + 'px')
        //         .style('top', (d.pageY - 25) + 'px')
        //         .style('display', 'inline-block')
        //         .text(d.target.__data__.len);
        // }

        // function hideTooltip() {
        //     tooltip.style('display', 'none');
        // }

        // if (!reverse && leave) {
        //     exitYear(innerCircle.selectAll('path'), dur.slow)
        //     exitYear(album_data.selectAll('g'), dur.slow)
        // }
        const circle_data = d3.range(1000);

        vorCircle.selectAll('.year').remove();

        // const circles = whiteCircle.selectAll("circle")
        //     .data(circle_data)
        //     .enter()
        //     .append("circle")
        //     .attr("cx", 0)
        //     .attr("cy", 0)
        //     .attr("r", (d,i) => (i+1)*1.3)
        //     .attr('fill', 'none')
        //     .attr("stroke", "white");

    },
    'all-album': ({ reverse, leave, currentStep }) => {
        if (!reverse && !leave) STEP.title({ leave: true });

        const dur = getDuration({ leave, reverse });
        vorCircle.selectAll('.year2').remove();

        if (innerWidth >= 750 && currentStep == 'all-album') {
            $figure.style('z-index', 100)
        }

        // // 分块
        const nested = d3.groups(singerData, d => d.digit_year)
            .map(d => ({
                key: +d[0],
                values: d[1],
                len: d[1].length
            })).sort(function (a, b) { return b.key - a.key });

        let scale = d3.scaleLinear()
            .domain([0, d3.max(nested, d => d.len) * 1.1])
            .range([0, 2 * PI]);

        let scale_year = d3.scaleLinear()
            .domain([2023, 2014])
            .range([0, 9]);

        // 大圆半径
        let keys = nested.map((d, i) => d.key);
        //number of arcs
        const numArcs = keys.length;
        const arcWidth = (chartRadius - arcMinRadius - numArcs * arcPadding) / numArcs;

        // 内圆

        diameter = getOuterRadius(11, numArcs, arcWidth) * 1.1

        if (!reverse && !leave) {
            exitYear(innerCircle.selectAll('path'), dur.medium)

            innerCircle
                .append('image')
                .attr('class', 'vinyl')
                .attr('href', './img/vinyl.png')
                .attr('preserveAspectRatio', 'xMidYMid meet')
                .style('opacity', 0)
                .transition()
                .delay(dur.medium)
                .duration(dur.medium)
                .style('opacity', 1)
                .attr('height', diameter * 2)
                .attr('x', -diameter)
                .attr('y', -diameter)
        }

        axis.selectAll('text').remove()
        axis
            .selectAll('text')
            .data(nested)
            .enter()
            .append('text')
            .attr('x', labelPadding)
            .attr('y', (d, i) => -getOuterRadius(i, numArcs, arcWidth) + arcPadding * 4)
            .text(d => `${d.key}`);

        // 外环
        let arc = d3.arc()
            .innerRadius((d, i) => getInnerRadius(scale_year(d.data.digit_year), numArcs, arcWidth))
            .outerRadius((d, i) => getOuterRadius(scale_year(d.data.digit_year), numArcs, arcWidth))
        // .startAngle(0)
        // .endAngle((d, i) => {scale(d)})

        let pie2 = d3.pie()
            .padAngle(0.005)
            .sort(function (a, b) {
                return b.entity - a.entity
            })
            .value(d => d.digit_year)
            .endAngle(d => scale(d.length));

        // let radialAxis = svg_g.append('g')
        //     .attr('class', 'all-axis axis')
        //     .selectAll('g')
        //     .data(nested)
        //     .enter().append('g');

        // radialAxis.append('text')
        //     .attr('x', labelPadding)
        //     .attr('y', (d, i) => -getOuterRadius(i, numArcs, arcWidth) + arcPadding)
        //     .text(d => `${d.key}`);

        //data arcs
        album_data
            .selectAll('path.arc')
            .transition()
            .duration(dur.medium * 0.8)
            .ease(d3.easePolyOut)
            .style('opacity', 0)
            .remove()

        arcs = album_data
            .selectAll('g')
            .data(nested)
            .enter()
            .append('g')
            .attr('class', 'year')
            .attr('data-id', d => d.key)
            .selectAll('path')
            .data(d => pie2(d.values))
            .enter()
            .append('path')
            .attr('class', d => `singer ${entities(d.data.entity)} ${songs(d.data.song_number)}`)
            .style('opacity', 0.2)
            .transition()
            .delay(dur.medium)
            .duration(dur.slow)
            .ease(d3.easePolyOut)
            .style('opacity', 1)
            .attr("fill", d => color2(d.data.identity))
            .attr('d', arc)

        // 封面

        defs_circle
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', diameter)

        defs.append('clipPath').attr('id', 'circle-clip').append('use').attr('xlink:href', '#circle')

        album_img
            .attr('clip-path', 'url(#circle-clip)')
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('height', diameter * 2)
            .attr('x', -diameter)
            .attr('y', -diameter)

        //详细信息
        album_name
            .attr('y', diameter + FONT_SIZE * 1.2)
            // .attr('x', -diameter)
            .attr('text-anchor', 'middle')

        album_singer
            .attr('y', diameter + FONT_SIZE * 2.4)
            // .attr('x', -diameter/2)
            .attr('text-anchor', 'middle')

        album_date
            .attr('y', diameter + FONT_SIZE * 3.6)
            // .attr('x', -diameter/2)
            .attr('text-anchor', 'middle')

        //data arcs
        vorCircle
            .selectAll('g')
            .data(nested)
            .enter()
            .append('g')
            .attr('class', 'year')
            .attr('data-id', d => d.key)
            .selectAll('path')
            .data(d => pie2(d.values))
            .enter()
            .append('path')
            .attr('class', d => `singer ${entities(d.data.entity)} is-opacity0`)
            .attr("fill", d => color2(d.data.identity))
            .attr('d', arc)
            .on('mouseenter', showTooltip)
            .on('mouseout', hideTooltip)

        function showTooltip(d) {
            const album_data = d.srcElement.__data__.data
            // 加个hide标签
            vinyl.attr('visibility', 'hidden')

            album_img.attr('href', `./img/digit/${album_data.index}.webp`)
            album_name.text(`《${album_data.album}》`)
            album_singer.text(album_data.singer)
            album_date.text(album_data.digit_date2)


            d3.selectAll('.singer').classed('is-opacity', true)
            d3.selectAll('.axis').classed('is-opacity', true)
            d3.select(d.target).classed('is-opacity', false).classed('is-not-opacity', true)
        }

        function hideTooltip() {
            album_img.attr('href', '/')
            album_name.text('')
            album_singer.text('')
            album_date.text('')
            vinyl.attr('visibility', 'visible')
            d3.selectAll('.singer').classed('is-opacity', false)
            d3.selectAll('.axis').classed('is-opacity', false)
            vorCircle.selectAll('.singer').classed('is-opacity0', true)
            vorCircle.selectAll('.is-not-opacity').classed('is-not-opacity', false)
        }

        album_data.selectAll('.lessSongs').classed('is-grey', false)
    },
    'more-songs': ({ reverse, leave, currentStep }) => {
        if (!reverse && !leave) STEP['all-album']({ leave: true });

        const dur = getDuration({ leave, reverse });
        vorCircle.selectAll('.year').remove();

        if (reverse) {
            album_data.selectAll('g.identity').remove();
            axis.selectAll('text').remove();
            STEP['all-album']({ reverse, leave })
        };

        if (reverse && innerWidth >= 750) {
            $figure.style('z-index', 100)
        }

        d3.selectAll('.year').selectAll('.lessSongs').classed('is-grey', true)
        d3.selectAll('.year').selectAll('.moreSongs').classed('is-grey', false)


        // 专辑详细信息
        // 封面

        defs_circle
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', diameter)
            .attr('color', 'white')

        album_img
            .attr('clip-path', 'url(#circle-clip)')
            .attr('height', diameter * 2)
            .attr('x', -diameter)
            .attr('y', -diameter)
            .attr('color', 'white')
            .attr('preserveAspectRatio', 'xMidYMid slice');

        //详细信息
        album_name
            .attr('y', diameter + FONT_SIZE * 1.2)
            // .attr('x', -diameter)
            .attr('text-anchor', 'middle')

        album_singer
            .attr('y', diameter + FONT_SIZE * 2.4)
            // .attr('x', -diameter/2)
            .attr('text-anchor', 'middle')

        album_date
            .attr('y', diameter + FONT_SIZE * 3.6)
            // .attr('x', -diameter/2)
            .attr('text-anchor', 'middle')

        // vorCircle
        const vorData = d3.groups(singerData, d => d.digit_year)
            .map(d => ({
                key: +d[0],
                values: d[1],
                len: d[1].length
            })).sort(function (a, b) { return b.key - a.key });

        let scale = d3.scaleLinear()
            .domain([0, d3.max(vorData, d => d.len) * 1.1])
            .range([0, 2 * PI]);

        let scale_year = d3.scaleLinear()
            .domain([2023, 2014])
            .range([0, 9]);

        // 大圆半径
        let keys = vorData.map((d, i) => d.key);
        //number of arcs
        const numArcs = keys.length;
        const arcWidth = (chartRadius - arcMinRadius - numArcs * arcPadding) / numArcs;

        // 外环
        let arc = d3.arc()
            .innerRadius((d, i) => getInnerRadius(scale_year(d.data.digit_year), numArcs, arcWidth))
            .outerRadius((d, i) => getOuterRadius(scale_year(d.data.digit_year), numArcs, arcWidth))
        // .startAngle(0)
        // .endAngle((d, i) => {scale(d)})

        let pie2 = d3.pie()
            .padAngle(0.005)
            .sort(function (a, b) {
                return b.entity - a.entity
            })
            .value(d => d.digit_year)
            .endAngle(d => scale(d.length));

        //data arcs
        vorCircle
            .selectAll('g')
            .data(vorData)
            .enter()
            .append('g')
            .attr('class', 'year2')
            .attr('data-id', d => d.key)
            .selectAll('path')
            .data(d => pie2(d.values))
            .enter()
            .append('path')
            .attr('class', d => `singer ${entities(d.data.entity)} ${songs(d.data.song_number)} is-opacity0`)
            .attr("fill", d => color2(d.data.identity))
            .attr('d', arc)

        // vorCircle.selectAll('.year').remove()

        vorCircle.selectAll('.year2').selectAll('.moreSongs')
            .on('mouseenter', showTooltip)
            .on('mouseout', hideTooltip)

        function showTooltip(d) {
            const album_data = d.srcElement.__data__.data
            // 加个hide标签
            vinyl.attr('visibility', 'hidden')

            album_img.attr('href', `./img/digit/${album_data.index}.webp`)
            album_name.text(`《${album_data.entity_album}》`)
            album_singer.text(album_data.singer)
            album_date.text(album_data.entity_album_date)


            d3.selectAll('.singer').classed('is-opacity', true)
            d3.selectAll('.axis').classed('is-opacity', true)
            d3.select(d.target).classed('is-opacity', false).classed('is-not-opacity', true)
        }

        function hideTooltip() {
            album_img.attr('href', '/')
            album_name.text('')
            album_singer.text('')
            album_date.text('')
            vinyl.attr('visibility', 'visible')
            d3.selectAll('.singer').classed('is-opacity', false)
            d3.selectAll('.axis').classed('is-opacity', false)
            vorCircle.selectAll('.singer').classed('is-opacity0', true)
            vorCircle.selectAll('.is-not-opacity').classed('is-not-opacity', false)
        }
    },
    'entity-album': ({ reverse, leave, currentStep }) => {
        if (!reverse && !leave) STEP['more-songs']({ leave: true });

        const dur = getDuration({ leave, reverse });
        vorCircle.selectAll('.year').remove();

        if (reverse) {
            album_data.selectAll('g.identity').remove();
            axis.selectAll('text').remove();
            STEP['all-album']({ reverse, leave })
        };

        if (reverse && innerWidth >= 750) {
            $figure.style('z-index', 100)
        }

        d3.selectAll('.year').selectAll('.entity.lessSongs').classed('is-grey', false)
        d3.selectAll('.year').selectAll('.digit').classed('is-grey', true)

        // 专辑详细信息
        // 封面

        defs_circle
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', diameter)
            .attr('color', 'white')

        album_img
            .attr('clip-path', 'url(#circle-clip)')
            .attr('height', diameter * 2)
            .attr('x', -diameter)
            .attr('y', -diameter)
            .attr('color', 'white')
            .attr('preserveAspectRatio', 'xMidYMid slice');

        //详细信息
        album_name
            .attr('y', diameter + FONT_SIZE * 1.2)
            // .attr('x', -diameter)
            .attr('text-anchor', 'middle')

        album_singer
            .attr('y', diameter + FONT_SIZE * 2.4)
            // .attr('x', -diameter/2)
            .attr('text-anchor', 'middle')

        album_date
            .attr('y', diameter + FONT_SIZE * 3.6)
            // .attr('x', -diameter/2)
            .attr('text-anchor', 'middle')

        // vorCircle
        const vorData = d3.groups(singerData, d => d.digit_year)
            .map(d => ({
                key: +d[0],
                values: d[1],
                len: d[1].length
            })).sort(function (a, b) { return b.key - a.key });

        let scale = d3.scaleLinear()
            .domain([0, d3.max(vorData, d => d.len) * 1.1])
            .range([0, 2 * PI]);

        let scale_year = d3.scaleLinear()
            .domain([2023, 2014])
            .range([0, 9]);

        // 大圆半径
        let keys = vorData.map((d, i) => d.key);
        //number of arcs
        const numArcs = keys.length;
        const arcWidth = (chartRadius - arcMinRadius - numArcs * arcPadding) / numArcs;

        // 外环
        let arc = d3.arc()
            .innerRadius((d, i) => getInnerRadius(scale_year(d.data.digit_year), numArcs, arcWidth))
            .outerRadius((d, i) => getOuterRadius(scale_year(d.data.digit_year), numArcs, arcWidth))
        // .startAngle(0)
        // .endAngle((d, i) => {scale(d)})

        let pie2 = d3.pie()
            .padAngle(0.005)
            .sort(function (a, b) {
                return b.entity - a.entity
            })
            .value(d => d.digit_year)
            .endAngle(d => scale(d.length));

        //data arcs
        vorCircle
            .selectAll('g')
            .data(vorData)
            .enter()
            .append('g')
            .attr('class', 'year2')
            .attr('data-id', d => d.key)
            .selectAll('path')
            .data(d => pie2(d.values))
            .enter()
            .append('path')
            .attr('class', d => `singer ${entities(d.data.entity)} is-opacity0`)
            .attr("fill", d => color2(d.data.identity))
            .attr('d', arc)

        vorCircle.selectAll('.year').remove()

        vorCircle.selectAll('.year2').selectAll('.entity')
            .on('mouseenter', showTooltip)
            .on('mouseout', hideTooltip)

        function showTooltip(d) {
            const album_data = d.srcElement.__data__.data
            // 加个hide标签
            vinyl.attr('visibility', 'hidden')

            album_img.attr('href', `./img/entity/${album_data.index}.webp`)
            album_name.text(`《${album_data.entity_album}》`)
            album_singer.text(album_data.singer)
            album_date.text(album_data.entity_album_date)


            d3.selectAll('.singer').classed('is-opacity', true)
            d3.selectAll('.axis').classed('is-opacity', true)
            d3.select(d.target).classed('is-opacity', false).classed('is-not-opacity', true)
        }

        function hideTooltip() {
            album_img.attr('href', '/')
            album_name.text('')
            album_singer.text('')
            album_date.text('')
            vinyl.attr('visibility', 'visible')
            d3.selectAll('.singer').classed('is-opacity', false)
            d3.selectAll('.axis').classed('is-opacity', false)
            vorCircle.selectAll('.singer').classed('is-opacity0', true)
            vorCircle.selectAll('.is-not-opacity').classed('is-not-opacity', false)
        }
    },
    'singer-type': ({ reverse, leave, currentStep }) => {
        if (!reverse && !leave) STEP['entity-album']({ leave: true });

        vorCircle.selectAll('.year2').remove();

        const dur = getDuration({ leave, reverse })
        const entityData = singerData.filter(d => d.entity === true)
        let nested = d3.groups(singerData, d => d.identity)
            .map(d => ({
                key: d[0],
                values: d[1],
                len: d[1].length
            }));

        nested.sort(function (a, b) {
            return d3.ascending(singerType.indexOf(a.key), singerType.indexOf(b.key));
        })

        let scale = d3.scaleLinear()
            .domain([0, d3.max(nested, d => d.len) * 1.1])
            .range([0, 2 * PI]);

        let identity = nested.map(d => d.key)

        // 大圆半径
        let keys = nested.map((d, i) => d.key);
        //number of arcs
        const numArcs = keys.length;
        const arcWidth = (chartRadius - arcMinRadius - numArcs * arcPadding) / numArcs;

        let arc = d3.arc()
            .innerRadius((d, i) => getInnerRadius(identity.indexOf(d.data.identity), numArcs, arcWidth))
            .outerRadius((d, i) => getOuterRadius(identity.indexOf(d.data.identity), numArcs, arcWidth));

        let pie2 = d3.pie()
            .padAngle(0.005)
            .sort(function (a, b) {
                return b.entity - a.entity
            })
            .value(d => identity.indexOf(d.identity) + 1)
            .endAngle(d => scale(d.length));

        axis.selectAll('text').remove()

        axis
            .selectAll('text')
            .data(nested)
            .enter()
            .append('text')
            .attr('x', labelPadding)
            .attr('y', (d, i) => -getOuterRadius(i, numArcs, arcWidth) + arcPadding * 4)
            .text(d => `${d.key}`);

        //data arcs
        album_data.selectAll('g.year').remove()

        album_data
            .selectAll('g')
            .data(nested)
            .enter()
            .append('g')
            .attr('class', 'identity')
            .attr('data-id', d => d.key)
            .selectAll('path')
            .data(d => pie2(d.values))
            .enter()
            .append('path')
            .attr('class', d => `singer ${entities(d.data.entity)}`)
            .attr("fill", d => color2(d.data.identity))
            .attr('d', arc)
            .style('opacity', 0)
            .transition()
            .duration(dur.medium)
            .style('opacity', 1)

        album_data.selectAll('path.digit').transition().delay(dur.medium)
            .duration(dur.medium)
            .style('fill', '#ddd')

        $figure.style('z-index', -100)
    }
};

function updateDimensions() {
    innerHeight = window.innerHeight;
    innerWidth = $section.node().offsetWidth;
    secPad = (d3.select('#content').node().offsetWidth - innerWidth) / 2;
    arti_width = $article.node().offsetWidth;
    height = Math.floor(innerHeight * 0.9);

    width = innerWidth <= 760 ? innerWidth : innerWidth - arti_width;
    max_r = height <= width ? height : width
}

function updateStep({ reverse = true, leave = false }) {
    if (STEP[currentStep]) STEP[currentStep]({ reverse, leave, currentStep })
}

function entities(d) {
    if (d) { return 'entity' } else { return 'digit' }
}

function songs(d) {
    if (d > 2) { return 'moreSongs' } else { return 'lessSongs' }
}

function resizeScroll() {
    scroller.resize();
}

function resize() {
    updateDimensions();

    $figure
        .style('width', `${width}px`)
        .style('right', `${secPad}px`)

    FONT_SIZE = width * 0.0225

    const svg_h = innerHeight - MARGIN.top - MARGIN.bottom
    const svg_w = width

    arcMinRadius = max_r / 8;
    arcPadding = max_r * 0.005;
    labelPadding = -max_r * 0.01;

    // 大圆半径
    chartRadius = max_r / 2 - 30;

    $svg.attr('width', width)
        .attr('height', '100vh');

    svg_g.attr('transform', `translate(${width / 2},${innerHeight / 2})`);

    // step height and padding
    $step.style('padding-bottom', innerHeight + 'px');
    const $title = $step.filter((d, i) => i === 0)
    // $title.style('margin-top', (innerHeight) * 0.65 + 'px');
    // $step
    //     .filter((d, i) => i === stepCount - 1)
    //     .style('padding-bottom', innerHeight * 0.9);

    if (innerWidth <= 760) {
        $figure.style('z-index', '-100');
        $article.style('margin', '0 auto')
    } else {
        $article.style('margin', 0)
    }

    resizeScroll()
    updateStep({ reverse: false, leave: true });
};

function handleStepEnter({ index, element, direction }) {
    currentStep = d3.select(element).attr('data-step');
    updateStep({ reverse: direction === 'up', currentStep: currentStep });
};

function handleHoverEnter() {
    hoverEnabled = true;
}

function handleHoverExit({ direction }) {
    if (direction === 'up') {
        hoverEnabled = false;
    }
}

function setupScroller() {
    Stickyfill.add($figure.node());

    scroller.setup({
        // 选择了所有step类，组成一个DOM元素的数组
        step: $step.nodes(),
        offset: 0.95
    }).onStepEnter(handleStepEnter)

    scrollerHover.setup({
        step: '.step-hover',
        offset: 0
    }).onStepEnter(handleHoverEnter)
        .onStepExit(handleHoverExit)
};

if (document.getElementById('overview') && history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}

function loadData(singer) {
    return new Promise((resolve, reject) => {
        singerData = singer.map(d => ({
            ...d
        }));
        resolve();
    })
};

// lode data
function init(singer) {
    loadData(singer).then(() => {
        resize()
        setupScroller();
    });
};


export default { init, resize };