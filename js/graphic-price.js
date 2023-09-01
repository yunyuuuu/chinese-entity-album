import 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.2/d3.min.js';
import 'https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.21/lodash.js';
import cleanData from './clean-data.js';
// import tooltip from './tooltip.js';

const MARGIN = { top: 20, bottom: 40, left: 20, right: 20 };
const FONT_SIZE = 12;
const REM = 16;
const OFFSET = 0.4;

let singerData = null;
let med_dig = 0;
let med_ent = 0;

let width = 0;
let height = 0;
let maxHeight = FONT_SIZE * 5;
let textWidth = REM * 8;
let svgWidth = 0;
let svgHight = 0;
let x = null;
let y = null;
let innerWidth = null;

const $section = d3.select('#price');
const $figure = $section.select('.figure--chart');
const $svg = $figure.select('svg');
const $btn = $section.select('.btn')

function updateDimensions() {
    width = $figure.node().offsetWidth - MARGIN.left - MARGIN.right;
    height = maxHeight * OFFSET * singerData.length + maxHeight;
    innerWidth = window.innerWidth
}

function resize() {
    updateDimensions();

    textWidth = REM * 8;
    maxHeight = FONT_SIZE * 5;

    //大圆半径
    svgWidth = width + MARGIN.left + MARGIN.right;
    svgHight = height + MARGIN.top + MARGIN.bottom

    x = d3.scaleLinear().range([0, svgWidth * 0.71]).domain([0, d3.max(singerData, function (d) { return d.entity_price; })]);
    y = d3.scalePoint().rangeRound([height, 10]).padding(0.4).domain(singerData.map(function (d) { return d.entity_album; }));

    $svg.attr('width', svgWidth)
        .attr('height', svgHight);

    function tickSize(){
        if(innerWidth < 870){
            return -height
        }else{
            return -6
        }
    }
    
    // x-axis
    $svg.select(".x.axis")
        .attr("transform", `translate(${svgWidth / 4}, ${MARGIN.top - maxHeight * OFFSET + 30})`)
        .call(d3.axisTop(x)
            .tickSize(tickSize())
            .tickFormat((val, i) => {
                const suffix = i === 0 ? '￥' : '';
                return `${suffix}${val}`;
            }));

    // y-axis
    $svg.select(".y.axis")
        .attr('transform', `translate(${svgWidth * 0.23}, ${MARGIN.top - maxHeight * OFFSET + 30})`)
        .call(d3.axisLeft(y));

    let dumbbellGroup = $svg.select(".dumbbellGroup")
        .attr('transform', `translate(${svgWidth / 4}, ${MARGIN.top - maxHeight * OFFSET + 30})`);

    dumbbellGroup.select('.med_dig').attr('x1', x(med_dig)).attr('x2', x(med_dig)).attr('y1',0).attr('y2', height)
    dumbbellGroup.select('.med_ent').attr('x1', x(med_ent)).attr('x2', x(med_ent)).attr('y1',0).attr('y2', height)

    let dumbbell = dumbbellGroup.selectAll(".dumbbell")

    dumbbell
        .attr("transform", function (d) { return "translate(0," + y(d.entity_album) + ")"; });

    dumbbell
        .selectAll('.linearG')
        .attr("x1", function (d) { return x(d.price); })
        .attr("x2", function (d) { return x(d.entity_price); })
        .attr("y1", 0)
        .attr("y2", 0)
        .attr('gradientUnits', 'userSpaceOnUse') //这是能否显示的关键

    // lines: between dots
    dumbbell.selectAll(".line.between")
        .attr("x1", function (d) { return x(d.price); })
        .attr("x2", function (d) { return x(d.entity_price); })
        .attr("y1", 0)
        .attr("y2", 0)
        .attr('stroke', d => `url(#linear${d.index})`);

    // dots: current inventory
    dumbbell.selectAll(".circle.current")
        .attr("x", function (d) { return x(d.entity_price) - 10; })
        .attr("y", -10)
        .attr('height', 20)
        .attr('href', d => {
            if (d.entity_type == 'USB') {
                return './img/USB-fill.png'
            } else if (d.entity_type == '黑胶') {
                return './img/vinyl-record.png'
            } else {
                return './img/cd.png'
            }
        });

    // data labels: current
    dumbbell.selectAll(".text.current")
        .attr("x", function (d) { return x(d.entity_price); })
        .attr("y", 0)
        .attr("dy", ".35em")
        .attr("dx", 10)
        .text(function (d) { return d.entity_price; });

    // data labels: future
    dumbbell.selectAll(".text.future")
        .attr("x", function (d) { return x(d.price); })
        .attr("y", 0)
        .attr("dy", ".35em")
        .attr("dx", -6)
        .attr("text-anchor", "end")
        .text(function (d) { return d.price; });

    // dots: future inventory
    dumbbell.selectAll(".circle")
        .attr("cx", function (d) { return x(d.price); })
        .attr("cy", 0)
        .attr("r", 4);
};

function setupChart() {
    // sort vehicles from highest to lowest inventory
    singerData.sort(function (a, b) {
        // range is flipped, so it ascends from bottom of chart
        return d3.ascending(+a.entity_price, +b.entity_price);
    });

    med_dig = d3.mean(singerData, d=>d.price)
    med_ent = d3.mean(singerData, d=>d.entity_price)

    // x-axis
    $svg.append("g")
        .attr("class", "x axis")
        .append("text")

    // y-axis
    $svg.append("g")
        .attr("class", "y axis")
    // .append('text')

    let dumbbellGroup = $svg.append("g")
        .attr("class", "dumbbellGroup")

    dumbbellGroup.append("line")
        .attr("class", "med_dig mean")

    dumbbellGroup.append("line")
        .attr("class", "med_ent mean")

    let dumbbell = dumbbellGroup.selectAll(".dumbbell")
        .data(singerData)
        .enter().append("g")
        .attr("class", "dumbbell")

    dumbbell
        .append('defs')
        .append('linearGradient')
        .attr('id', d => `linear${d.index}`)
        .attr('class', 'linearG')

    dumbbell.selectAll('linearGradient').append('stop').attr('offset', '0%').attr('stop-color', '#85b7ce')
    dumbbell.selectAll('linearGradient').append('stop').attr('offset', '100%').attr('stop-color', '#e75d6f')

    // lines: between dots
    dumbbell.append("line")
        .attr("class", "line between")

    // // lines: before dots
    // dumbbell.append("line")
    //     .attr("class", "line before")
    //     .attr("x1", 0)
    //     .attr("x2", function (d) { return x(d.price); })
    //     .attr("y1", 0)
    //     .attr("y2", 0);

    // dots: current inventory
    dumbbell.append("image")
        .attr("class", "circle current")

    // data labels: current
    dumbbell.append("text")
        .attr("class", "text current")

    // data labels: future
    dumbbell.append("text")
        .attr("class", "text future")

    // dots: future inventory
    dumbbell.append("circle")
        .attr("class", "circle future")
}

function loadData(singer) {
    return new Promise((resolve, reject) => {
        singerData = singer.filter(d => d.entity == true).filter(d => d.entity_price != 0).map(d => ({
            ...d
        }))
        resolve();
    })
};

function setupToggle() {
    $btn.on('click', () => {
        const truncated = $figure.classed('is-truncated');
        const text = truncated ? '收起' : '展开';
        $btn.text(text);
        $figure.classed('is-truncated', !truncated);

        if (!truncated) {
            const y = +$btn.attr('data-y');
            window.scrollTo(0, y)
        }

        $btn.attr('data-y', window.scrollY)
        $figure.select('.show-more').classed('is-visible', !truncated)
    })
}

// lode data
function init(singer) {
    loadData(singer).then(() => {
        updateDimensions();
        setupChart();
        setupToggle();
        resize();
    });
};


export default { init, resize };