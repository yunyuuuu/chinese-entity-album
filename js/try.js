// 分块
    const nested = d3.groups(singerData, d => d.digit_year)
        .map(d => ({
            key: +d[0],
            values: d[1],
            len: d[1].length
        })).sort(function (a, b) { return b.key - a.key });

    width = 960;
    height = 660;
    const color2 = d3.scaleOrdinal().range(['#00429d', '#3e67ae', '#618fbf', '#85b7ce', '#b1dfdb', '#ffcab9', '#fd9291', '#e75d6f', '#c52a52', '#93003a']);

    let svg = $figure.append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    const PI = Math.PI;
    const arcMinRadius = 90;
    const arcPadding = 10;
    const labelPadding = -5;
    const numTicks = 10;

    let scale = d3.scaleLinear()
        .domain([0, d3.max(nested, d => d.len) * 1.1])
        .range([0, 2 * PI]);

    let scale_year = d3.scaleLinear()
        .domain([2023, 2014])
        .range([0, 9]);

    // 大圆半径
    let chartRadius = height / 2 - 40;
    let keys = nested.map((d, i) => d.key);
    //number of arcs
    const numArcs = keys.length;
    const arcWidth = (chartRadius - arcMinRadius - numArcs * arcPadding) / numArcs;

    // 内圆
    const vinyl = svg.append('g').attr('class', 'vinyl')

    const diameter = getOuterRadius(11) * 1.1

    vinyl
        .append('image')
        .attr('href', './img/vinyl.png')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('height', diameter * 2)
        .attr('x', -diameter)
        .attr('y', -diameter)

    // 专辑详细信息
    const tooltip = svg.append('g')
        .attr('class', 'tooltip');

    // 封面
    const defs = tooltip
        .append('defs')

    defs
        .append('circle')
        .attr('id', 'circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', diameter)

    defs.append('clipPath').attr('id', 'circle-clip').append('use').attr('xlink:href', '#circle')

    let album_img = tooltip
        .append('image')
        .attr('class', 'album_img')
        .attr('clip-path', 'url(#circle-clip)')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('height', diameter * 2)
        .attr('x', -diameter)
        .attr('y', -diameter)

    //详细信息
    const album_name = tooltip
        .append('text')
        .attr('class', 'album_name')
        .attr('y', diameter+14)
        // .attr('x', -diameter/2)

    const album_singer = tooltip
        .append('text')
        .attr('class', 'album_singer')
        .attr('y', diameter+28)
        // .attr('x', -diameter/2)

    const album_date = tooltip
        .append('text')
        .attr('class', 'album_date')
        .attr('y', diameter+42)
        // .attr('x', -diameter/2)

    // 外环
    let arc = d3.arc()
        .innerRadius((d, i) => getInnerRadius(scale_year(d.data.digit_year)))
        .outerRadius((d, i) => getOuterRadius(scale_year(d.data.digit_year)))
    // .startAngle(0)
    // .endAngle((d, i) => {scale(d)})

    let pie2 = d3.pie()
        .padAngle(0.005)
        .sort(function (a, b) {
            return b.entity - a.entity})
        .value(d => d.digit_year)
        .endAngle(d => scale(d.length));

    let radialAxis = svg.append('g')
        .attr('class', 'r axis')
        .selectAll('g')
        .data(nested)
        .enter().append('g');

    radialAxis.append('text')
        .attr('x', labelPadding)
        .attr('y', (d, i) => -getOuterRadius(i) + arcPadding)
        .text(d => `${d.key}`);

    //data arcs
    let arcs = svg.append('g')
        .attr('class', 'data')
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
        .attr('class', d => `singer ${entities(d.entity)}`)
        .attr("fill", d => color2(d.data.identity))
        .attr('d', arc)
    // .append('path')
    // .attr('class', 'arc')
    // .style('fill', (d, i) => color2(i))

    // arcs.transition()
    //     .delay((d, i) => i * 200)
    //     .duration(1000)
    //     .attrTween('d', arcTween);


    arcs.on('mousemove', showTooltip)
    arcs.on('mouseout', hideTooltip)

    function arcTween(d, i) {
        let interpolate = d3.interpolate(0, d.len);
        return t => arc(interpolate(t), i);
    }

    function showTooltip(d) {
        const album_data = d.srcElement.__data__.data
        // 加个hide标签
        vinyl.attr('visibility', 'hidden')

        album_img.attr('href', album_data.digit_album_img)
        album_name.text(album_data.album)
        album_singer.text(album_data.singer)
        album_date.text(album_data.digit_date2)


        d3.selectAll('.singer').classed('is-opacity', true)
        d3.selectAll('.axis').classed('is-opacity', true)
        d3.select(d.target).classed('is-opacity', false)
    }

    function hideTooltip() {
        album_img.attr('href', '/')
        album_name.text('')
        album_singer.text('')
        album_date.text('')
        vinyl.attr('visibility', 'visible')
        d3.selectAll('.singer').classed('is-opacity', false)
        d3.selectAll('.axis').classed('is-opacity', false)
    }

    function rad2deg(angle) {
        return angle * 180 / PI;
    }

    function getInnerRadius(index) {
        return arcMinRadius + (numArcs - (index + 1)) * (arcWidth + arcPadding);
    }

    function getOuterRadius(index) {
        return getInnerRadius(index) + arcWidth;
    }