
const tooltip = document.getElementById('tooltip');
const month= ["January","February","March","April","May","June","July","August","September","October","November","December"];
const colors = ['#4575b5','#74acd2','#abd9e9','#e0f3f9','#ffffbf','#ffe090','#fdae61','#f56d43','#d73027'];

let data = [];
let baseTemp=0;
let setTimeRef = null;


const getTemp = (base,variance) => {
    if(!variance || !base)
        return 0;
    return Number(Number(base+variance).toFixed(1));
}

const getColorFromTemperature = (base,variance) => {
    const temp =  getTemp(base,variance);
    let color = '#fff';
    if (temp < 12.8)
        color = colors[8];
    if (temp < 11.7)
        color = colors[7];
    if (temp < 10.6)
        color = colors[6];
    if (temp < 9.5)
        color = colors[5];
    if (temp < 8.3)
        color = colors[4];
    if (temp < 7.2)
        color = colors[3];
    if (temp < 6.1)
        color = colors[2];
    if (temp < 5.0)
        color = colors[1];
    if (temp < 3.9)
        color = colors[0];
    return color;
    
}


const heatMap = (data) => {

    data.monthlyVariance = [...data.monthlyVariance].filter(el => el.variance !== null || el.variance !== undefined)
    baseTemp=data.baseTemperature

    const w = 1500;
    const h = 550;
    const p = 60;
    const monthHeight = (h - 2 * p) / 12;
    const monthWidth = 5;
    

    const xScale = d3.scaleTime()
        .domain(
            [
                d3.min(data.monthlyVariance, d => {
                    const date = new Date(0);
                    date.setFullYear(d.year);
                    return date;
                }),
                d3.max(data.monthlyVariance, d => {
                    const date = new Date(0);
                    date.setFullYear(d.year);
                    return date;
                })
            ]
        )
        .range([p*2,w-p]);

    const yScale = d3.scaleTime()
        .domain([new Date(d3.max(data.monthlyVariance,d => {
            const date = new Date(0);
            date.setMonth(d.month-1);
            return date;
        })),d3.min(data.monthlyVariance,d => {
            const date = new Date(0);
            date.setMonth(d.month-1);
            return date;
        })])
        .range([h-p*2,p]);

    const xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeYear.every(10))
        .tickFormat(d3.timeFormat("%Y"));

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d3.timeFormat("%B"));

    const svg = d3.create('svg')
        .attr("width", w)
        .attr("height", h)
        .attr("id", 'heatMapSvg')

    svg
        .append("g")
        .attr('id','x-axis')
        .attr("transform", `translate(0,${h-p*2+(monthHeight/2)})`)
        .call(xAxis);

    svg
        .append("g")
        .attr('id','y-axis')
        .attr("transform", `translate(${p*2+(monthWidth/2)}, 0)`)
        .call(yAxis);

    svg
        .append("text")
        .attr('x',p/2)
        .attr('y',h/2)
        .text("Month")
        .attr("transform", `rotate(-90 ,${p/2}, ${h/2})`);

    svg
        .append("text")
        .text("Year")
        .attr('x',w/2-p*3)
        .attr('y',h-p)
        .attr("transform", `translate(${p*2+monthWidth/2}, 0)`);

    const map = svg.append("g")
        .attr("id", "map")

    map
        .selectAll("rect")
        .data(data.monthlyVariance)
        .enter()
        .append('rect')
        .attr('x',d => {
            const date = new Date(0);
            date.setFullYear(d.year);
            return xScale(date)+monthWidth/2;
        })
        .attr('y',d => {
            {
                const date = new Date(0);
                date.setMonth(d.month-1);
                return yScale(date)-monthHeight/2;
            }
        })
        .attr('data-month',d => d.month-1)
        .attr('data-year',d => d.year)
        .attr('data-temp',d => getTemp(data.baseTemperature,d.variance))
        .attr('width',monthWidth)
        .attr('height',monthHeight)
        .attr('class','cell')
        .attr("fill", d => getColorFromTemperature(data.baseTemperature,d.variance));

    const legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${p*2}, ${(h-p)})`)

        const tickValues = [2.8, 3.9, 5.0, 6.1, 7.2, 8.3, 9.5, 10.6, 11.7, 12.8];
        const tickWidth = 40;

        const colorScale = d3.scaleLinear()
        .domain([tickValues[0]-1, tickValues[tickValues.length-1]+1])
        .range([0,tickWidth * colors.length]);



        legend
        .selectAll("rect")
        .data(colors)
        .enter()
        .append('rect')
        .attr("x", (_d, i) => colorScale(tickValues[i]))
        .attr("y", 0)
        .attr("width",(_d,i) => colorScale(tickValues[i+1]) - colorScale(tickValues[i]))
        .attr("height", tickWidth/2)
        .attr("fill", d => d)
        .attr("stroke", '#111');

        const colorsAxis = d3.axisBottom(colorScale)
        .tickValues(tickValues)
        .tickFormat(d3.format('.1f'));

        legend.append("g")
        .attr("transform", `translate(0,${tickWidth/2})`)
        .call(colorsAxis)

    document.getElementById('heat-map').appendChild(svg.node())
}

const showToolTip = (monthIndex,year,temp,x,y) => {
    const v = Number(temp)-baseTemp

    tooltip.setAttribute('data-year',year);
    tooltip.innerHTML = `
        <div>
            <p class="date">${year} - ${month[monthIndex]}</p>
            <p class="temperature">${temp}&deg;C</p>
            <p class="variance">${v.toFixed(1)}&deg;C</p>
        </div>
    `
    tooltip.style.left=x+10+'px';
    tooltip.style.top=y-10+'px';
    if(tooltip.classList.contains('hidden'))
        tooltip.classList.remove('hidden');

}

window.addEventListener('mouseover',(e) => {
    if(!e.target.classList.contains('cell'))
        tooltip.classList.add('hidden');
})

const addElementEvents = () => {
    const cells = document.querySelectorAll('.cell');
    if(cells){
        cells.forEach(cell => {
            cell.addEventListener('mouseover',(e) => {
                if(setTimeRef){
                    clearTimeout(setTimeRef)
                }
                setTimeRef = setTimeout(() => {
                    showToolTip(cell.getAttribute('data-month'), cell.getAttribute('data-year'), cell.getAttribute('data-temp') , e.pageX,e.pageY);
                }, 10);
            });
        });
    }
}

fetch('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json')
    .then(res => res.json())
    .then(data => {
        heatMap(data)
        addElementEvents()
    })