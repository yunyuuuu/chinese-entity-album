import 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.2/d3.min.js';
import 'https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.21/lodash.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/d3-sankey/0.12.3/d3-sankey.min.js'
import cleanData from './clean-data.js';
// import tooltip from './tooltip.js';

const d3 = window.d3;

const MARGIN = { top: 20, bottom: 40, left: 20, right: 20 };
const FONT_SIZE = 12;
const REM = 16;
const OFFSET = 0.4;
const VALUE = 0.2;

let singerData = null;
let nodesData = null;
let linksData = null;
let linksData2 = null;
let dic = { nodes: null, links: null };
let count = {};
let dpr = window.devicePixelRatio || 1;

let width = 0;
let height = 0;
let startWidth = 0;
let maxHeight = FONT_SIZE * 5;
let textWidth = REM * 8;
let svgWidth = 0;
let svgHight = 0;
let sankey = null;
let singer = 2;
let name = null;

const $section = d3.select('#things');
const $container = $section.select('#container')
const canvas = $container.append('canvas').attr('id', 'canvas')
const context = canvas.node().getContext('2d');
const customBase = document.createElement("custom")
const custom = d3.select(customBase)
let c = document.getElementById('canvas');

const singerType = ['大陆歌手', '组合成员', '台湾歌手', '合作歌手', '乐队', '组合', '香港歌手', '其他', '虚拟歌手', 'rapper'];
const color2 = d3.scaleOrdinal()
    .range(['#00429D', '#3e67ae', '#618fbf', '#85b7ce', '#b1dfdb', '#ffcab9', '#fd9291', '#e75d6f', '#c52a52', '#93003a'])
    .domain(singerType);

function dataBind() {
    // data
    // Constructs and configures a Sankey generator.
    sankey = d3.sankey()
        .nodeId(d => d.name)
        .nodeAlign(d3.sankeyJustify) // d3.sankeyLeft, etc.
        .nodeWidth(10)
        .nodePadding(20)
        .extent([[startWidth, 10], [width - 40, height - 10]]);

    // Applies it to the data. We make a copy of the nodes and links objects
    // so as to avoid mutating the original.
    dic = sankey({
        nodes: nodesData.map(d => Object.assign({}, d)),
        links: linksData.map(d => Object.assign({}, d))
    });

    const sortArr = new Array();

    dic.nodes.filter(d=>d.is_singer==0).sort(function(a,b){
        return d3.ascending(+a.y0, +b.y0);
    })
    .map(d => sortArr.push(d.y0))

    linksData2 = linksData.map(d => ({
        ...d,
        x1: dic.nodes.filter(p => p.name == d.source)[0].x0,
        x2: dic.nodes.filter(p => p.name == d.target)[0].x0,
        y1: (dic.nodes.filter(p => p.name == d.source)[0].y0 + dic.nodes.filter(p => p.name == d.source)[0].y1) / 2,
        y2: (dic.nodes.filter(p => p.name == d.target)[0].y0 + dic.nodes.filter(p => p.name == d.target)[0].y1) / 2,
        y0: dic.nodes.filter(p => p.name == d.target)[0].y0
    }))

    console.log(linksData2)

    const rPrice = d3.scaleLinear().domain(d3.extent(singerData, d => d.entity_price)).nice().range([3, 17]);
    const rThings = d3.scaleLinear().domain([0, count['CD']]).range([3, 17])

    // Creates the things that represent the nodes.

    custom
        .selectAll('custom.circle')//
        .data(dic.nodes)
        .enter()
        .append('custom')
        .attr('class', "circle")
        .attr("x", d => d.x0)
        .attr("y", d => {
            if (d.is_singer == 1){
                return (d.y0 + d.y1) / 2
            }else if(d.is_singer == 0){
                return height/sortArr.length * sortArr.indexOf(d.y0)+10
            }})
        .attr('radious', d => {
            if (d.is_singer == 1) {
                return rPrice(d.fullData.entity_price)
            } else {
                return rThings(count[d.name])
            }
        })
        .attr('startAngle', 0)
        .attr('startAngle', 2 * Math.PI)
        .attr("fillstyle", d => {
            if (isMobile() && d.is_singer == 1) {
                return color2(d.fullData.identity)
            } else {
                return 'silver'
            }
        })
        .attr('name', d => d.name)
        .attr('singer', d => d.is_singer)

    // Creates the paths that represent the links.
    custom
        .selectAll('custom.line')//
        .data(linksData2)
        .enter()
        .append('custom')
        .attr('class', 'line')
        .attr("stroke-opacity", 0.5)
        .attr("x1", d => d.x1)
        .attr("x2", d => d.x2)
        .attr("y1", d => d.y1)
        .attr("y2", d => height/sortArr.length * sortArr.indexOf(d.y0)+10)
        .attr("stroke", d => {
            if (isMobile()) {
                return color2(d.singertype)
            } else {
                return 'silver'
            }
        })
        .attr('source', d => d.source)
        .attr('target', d => d.target)

    // Adds labels on the nodes.
    custom
        .selectAll('custom.name')//
        .data(dic.nodes)
        .enter()
        .append('custom')
        .attr('class', 'name')
        .attr("x", d => d.x0 < width / 2 ? d.x1 - 30 : d.x0 + 20)
        .attr("y", d => {
            if (d.is_singer == 1){
                return (d.y0 + d.y1) / 2
            }else if(d.is_singer == 0){
                return height/sortArr.length * sortArr.indexOf(d.y0)+10
            }})
        .attr('y0', d => d.y0)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .attr('text', d => d.name)
        .attr('name', d => d.name)
        .attr('singer', d => d.is_singer);
};

// 初始化
function draw() {
    const elements = custom.selectAll("custom.circle")
    const elements1 = custom.selectAll("custom.line")
    const elements2 = custom.selectAll("custom.name")

    elements1.each(function (d, i) {
        const node = d3.select(this)

        context.strokeStyle = node.attr('stroke')
        context.beginPath();
        context.moveTo(node.attr('x1'), node.attr('y1'));
        context.lineTo(node.attr('x2'), node.attr('y2'));
        context.stroke();
    })

    elements.each(function (d, i) {
        const node = d3.select(this)

        context.fillStyle = node.attr('fillstyle')
        context.beginPath();
        context.arc(
            node.attr("x"),
            node.attr("y"),
            node.attr("radious"),
            node.attr("startAngle"),
            node.attr("endAngle")
        )
        context.fill();
    })

    elements2.each(function (d, i) {
        const node = d3.select(this)

        context.font = "14px sans";
        context.fillStyle = 'black';
        if (node.attr('x') < width / 2) {
            context.textAlign = 'end';
        } else {
            context.textAlign = 'start';
        }
        context.textBaseline = 'middle'
        context.fillText(
            node.attr('text'),
            node.attr("x"),
            node.attr("y")
        )
    })
};

//获取交互信息，定义singer、name
function drawInfo(x, y) {
    const elements = custom.selectAll("custom.circle");
    const elements2 = custom.selectAll("custom.name");

    // 名字范围信息
    elements2.each(function (d, i) {
        const node = d3.select(this);
        const text = context.measureText(node.attr('text'));
        let tX = 0

        if (node.attr('singer') == 1) {
            tX = +node.attr("x") - text.width * 1.5;
        } else if (node.attr('singer') == 0) {
            tX = +node.attr("x");
        }

        context.fillStyle = "rgba(255,0,0,0)"
        context.beginPath();
        context.rect(
            tX,
            +node.attr("y") - 10,
            text.width * 1.5,
            20
        )
        context.fill();
        // 画布放大了，所以相应地位置也要改变
        if (context.isPointInPath(x * dpr, y * dpr)) {
            singer = node.attr("singer");
            name = node.attr("name");
        }
    })

    //圆形位置
    elements.each(function (d, i) {
        const node = d3.select(this)
        let r = node.attr("radious") <= 5 ? 5 : node.attr("radious")

        // context.fillStyle = node.attr('fillstyle')
        context.beginPath();
        context.arc(
            node.attr("x"),
            node.attr("y"),
            r,
            node.attr("startAngle"),
            node.attr("endAngle")
        )

        if (context.isPointInPath(x * dpr, y * dpr)) {
            singer = node.attr("singer");
            name = node.attr("name");
        }
        context.fill();
    });

};

// 交互
function drawColor(name) {
    const elements = custom.selectAll("custom.circle");
    const elements1 = custom.selectAll("custom.line");
    const elements2 = custom.selectAll("custom.name");
    let name2 = [];

    elements2.each(function (d, i) {
        const node = d3.select(this);

        context.font = "14px sans";
        if (singer == 0){
            context.fillStyle = node.attr('name') == name ? '#618fbf' : 'black';
        } else if(singer == 1){
            context.fillStyle = node.attr('name') == name ? '#e75d6f' : 'black';
        }
        if (node.attr('x') < width / 2) {
            context.textAlign = 'end';
        } else {
            context.textAlign = 'start';
        }
        context.textBaseline = 'middle'
        context.fillText(
            node.attr('text'),
            node.attr("x"),
            node.attr("y")
        )
    })

    elements1.each(function (d, i) {
        const node = d3.select(this)

        if (singer == 1) {
            if (context.strokeStyle = node.attr('source') == name) {
                context.strokeStyle = '#e75d6f';
                name2.push(node.attr('target'))
            } else {
                context.strokeStyle = node.attr('stroke')
            }
        } else if (singer == 0) {
            if (context.strokeStyle = node.attr('target') == name) {
                context.strokeStyle = '#618fbf';
                name2.push(node.attr('source'))
            } else {
                context.strokeStyle = node.attr('stroke')
            }
        }

        context.beginPath();
        context.moveTo(node.attr('x1'), node.attr('y1'));
        context.lineTo(node.attr('x2'), node.attr('y2'));
        context.stroke();
    })

    elements.each(function (d, i) {
        const node = d3.select(this)
        if (node.attr('name') == name || name2.includes(node.attr('name'))) {
            if (singer ==1){
                context.fillStyle = '#e75d6f'
            }else if(singer ==0){
                context.fillStyle = '#618fbf'
            }
            
        } else {
            context.fillStyle = node.attr('fillstyle')
        }
        context.beginPath();
        context.arc(
            node.attr("x"),
            node.attr("y"),
            node.attr("radious"),
            node.attr("startAngle"),
            node.attr("endAngle")
        )
        context.fill();
    });

};

function updateDimensions() {
    width = $container.node().offsetWidth - MARGIN.left - MARGIN.right;
    height = maxHeight * OFFSET * singerData.length + maxHeight;
};

function detect_move(e) {
    if (!isMobile()) {
        const x = e.offsetX
        const y = e.offsetY

        context.clearRect(0, 0, width + 100, height);
        // resize()
        drawInfo(x, y);

        if (singer == 1 || singer == 0) {
            drawInfo();
            drawColor(name);
        } else {
            draw()
        }
    }

}


function resize() {
    updateDimensions();

    textWidth = REM * 8;
    maxHeight = FONT_SIZE * 5;

    //大圆半径
    svgWidth = width + MARGIN.left + MARGIN.right;
    svgHight = height + MARGIN.top + MARGIN.bottom;

    if (width < 750) {
        startWidth = width / 4
    } else {
        startWidth = 250
    }

    // create canvas
    canvas.style.width = `${svgWidth}px`
    canvas.style.height = `${svgHight}px`

    canvas
        .attr("width", svgWidth * dpr)
        .attr("height", svgHight * dpr)

    canvas
        .style("width", svgWidth + 'px')
        .style("height", svgHight + 'px')

    context.scale(dpr, dpr)
};

function isMobile() {
    let flag = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return flag;
};

function loadData(singer) {
    return new Promise((resolve, reject) => {
        singerData = singer.filter(d => d.entity == true).filter(d => d.entity_price > 0).map(d => ({
            ...d
        }));
        let thingsData = new Array()
        singerData.map(d => d.entity_thing.map(p => thingsData.push(p)))
        thingsData = Array.from(new Set(thingsData)).filter(d => d != '' && d != '歌词' && d!='CD')
        const type = Array.from(new Set(singerData.map(d => d.entity_type)))
        nodesData = singerData
            .map(d => ({
                name: d.entity_album,
                categories: d.album,
                fullData: d,
                is_singer: 1
            })).concat(thingsData.map(d => ({
                name: d,
                categories: d,
                is_singer: 0
            })))
            .concat(type.map(d => ({
                name: d,
                categories: d,
                is_singer: 0
            })))

        const beforeData = singerData
            .map(d => ({
                source: d.entity_album,
                target: d.entity_thing
                    .concat(d.entity_type),
                singertype: d.identity
            }))

        linksData = beforeData
            .reduce((res, item) => res.concat(...item.target.map(p => ({ ...item, p }))), [])
            .map(d => ({
                source: d.source,
                target: d.p,
                value: VALUE,
                singertype: d.singertype
            })).filter(d => d.target != '' && d.target != '歌词')

        let arr = new Array()
        singerData.map(d => d.entity_thing.map(p => arr.push(p)))
        arr = arr.filter(d => d != '' && d != '歌词')
        singerData.map(d => arr.push(d.entity_type))

        for (let i = 0; i < arr.length; i++) {
            let num = arr[i];
            count[num] = count[num] ? count[num] + 1 : 1;
        }
        resolve();
    })
};


// lode data
function init(singer) {
    loadData(singer).then(() => {
        resize();
        dataBind();
        draw();
        c.addEventListener('mousemove', detect_move, false);
    });
};


export default { init, resize };