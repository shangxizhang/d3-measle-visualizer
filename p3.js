/* module syntax directly copied from d3.v4.js */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
        (factory((global.p3 = global.p3 || {})));
}(this, (function (exports) { 'use strict';

const transDur = 500; // if using transitions
const hexWidth = 39.5; // size of hexagons in US map
const txtWidth = 20; // width of state label on each row of grid
const plotOpac = 0.25; // opacity of plots
const plotStrokeWidth = 2.5; // width of stroke for drawing plot

var sortBy = "alpha"; // in synch with index.html
var colorBy = "value"; // in synch with index.html

// these are set by index.html
var popYears; // array of years for which there is population data
var caseYears; // array of all years for which we have case counts
var mapData; // data from hex map file
var popData; // (processed) data from population file
var caseData; // (processed) data from measles case counts
var plotWdth, plotHght; // dimensions of rectangle in which plots are drawn
var plotXScale; // linear scale for mapping years to position

// these are set by index.html, but
// YOU HAVE TO COMPUTE AND FILL IN THE CORRECT VALUES
var stRate; // per-state rate of measles per 1 million people
var usRate; // national average rate of measles per 1 million people

// little utility for making link to google search for measles
// in given year and state. If no state is passed, "US" is used.
// The year and state are made to be required in the search results
// by enclosing them in (escaped) quotes.
function searchLink(year, state) {
    state = state ? state : "US";
    return ("<a href=\"https://www.google.com/search?q="
            + "measles" + "+%22" + year + "%22+%22" + state + "%22"
            + "\" target=_blank>measles " + year + " " + state + "</a>");
}

/* ------------------------- do not change anything above this line */

/* YOUR CODE HERE. The functions already here are called by index.html,
   you can see what they do by uncommenting the console.log() */
var selectedYear;
var selectedState = ["AA", 0];



var colormap = function(d){
    var scl = d3.scaleLinear().domain([0,100, 1000, 30000]);
    var phi = scl.range([0, 0.1 * Math.PI, 0.2 * Math.PI, Math.PI])(d);
    var ret = d3.hsl(360 * Math.sin(phi),
                Math.sin(phi),
                scl.range([1, 0.5, 0.3 ,0])(d));
    return ret;
};

var colormap_diverge;

function sortBySet(wat) {
    console.log("sortBy ", wat);
    // maybe more of your code here ...

}
function colorBySet(wat) {
    console.log("colorBy ", wat);
    // maybe more of your code here ...

}

function caseRowFinish(d) {
    //console.log("caseRowFinish: ", d);
    // maybe more of your code here ...

    return d; // keep this line
}

function caseDataFinish(Data) {
    //console.log("caseDataFinish: Data=", Data);
    p3.caseData = Data;
    // initialize the per-state and US rate data arrays;
    // your code will compute correct rates
    p3.stRate = Data.map(row => ({
         state: row.StateAbbr,
         rates: Data.columns
                  .filter(y => !isNaN(y)) // keep only the (numeric) years
                  .map(y => ({year: +y, rate: 0})) // initialize to zero
         })
    );
    p3.usRate = p3.stRate[0].rates.map(y => y);
    // maybe more of your code here ...

    // uncomment this to see structure of stRate Object
    // console.log("caseFinish: stRate=", p3.stRate);
}

function popRowFinish(d) {
    // console.log("popRowFinish: ", d);
    // maybe more of your code here ...

    return d; // keep this line
}

function popDataFinish(Data) {
    //console.log("popDataFinish: ", Data);
    p3.popData = Data;
    // maybe more of your code here ...

}

function finalFinish() {
    //compute p3.stRate and p3.usRate
    // This would be a good place to compute rate per-state per-year
    // maybe more of your code here ...

    p3.stRate.forEach(function(d, i){//iterate per state
        var state = d.state
        var x = p3.caseData.filter(f => f.StateAbbr == state)[0]
        var y = p3.popData.filter(f => f.StateAbbr == state)[0]
        d.rates.forEach(function (e, j){//iterate per year
        //year calculations
        var year = e.year;
        var a0 = year > 2010 ? 2000 : Math.floor(year/10)*10;
        var a1 = year > 2010 ? 2010 : Math.ceil(year/10)*10;
        var scale = d3.scaleLinear()//LERPing
        .domain([a0, a1])
        .range([y[a0], y[a1]]);
        var r = 1000000 * x[year]/(scale(year));
        e.rate = r;
        })
    });

    p3.usRate.forEach(function(d, i){
        var year = d.year
        function pop(y){
            return p3.popData.map(d=>d[y]).reduce((a,b)=>a+b, 0);
        }
        var rate = p3.caseData.map(d => d[year]).reduce((a,b)=> a + b, 0);
        var a0 = year > 2010 ? 2000 : Math.floor(year/10)*10;
        var a1 = year > 2010 ? 2010 : Math.ceil(year/10)*10;
        var scale = d3.scaleLinear()
        .domain([a0, a1])
        .range([pop(a0), pop(a1)]);
        //var pop = p3.popData.map(d => d[year]).reduce((a,b)=> a + b, 0);
        d.rate = rate*1000000/scale(year);
    });

    var yscale_state = d3.scaleLinear().domain([0,30000]).range([p3.plotHght, 0])
    var line_state =  d3.line()
        .x(d => p3.plotXScale(d.year))
        .y(d => yscale_state(d.rate));
    //yscale for usRate
    var yscale = d3.scaleLinear().domain([0, 30000]).range([p3.plotHght, 0]);
    var line = d3.line()
        .x(d => p3.plotXScale(d.year))
        .y(d => yscale(d.rate));
    //y-axis    

    d3.select("#plotsG")
      .selectAll("path")
      .data(p3.stRate)
      .datum( d => d.rates).transition(p3.transDur)
      .attr("d", line_state)

    d3.select("#plotsG")
     .append("g")
     .call(d3.axisLeft(yscale).ticks(10, "d"))
    //make the plot
    d3.select("#plot-us")
     .datum(p3.usRate)
     .transition(p3.transDur)
     .attr("d",line);
}

    /*  1930--1967 (inclusive): Interval 0, prior the vaccine
        1968--1980: Interval 1
        1981--1997: Interval 2
        1998--2016: Interval 3*/


function yearSelect(year) {
    // indicate the selected year
    d3.select("#stateMapY").text(year);
    // maybe more of your code here ...
    selectedYear = year;

    var yearslice = p3.stRate.map(d => d.rates.filter(f => f.year == selectedYear)[0]);
    d3.select("#stateMapG").selectAll("path")
    .data(yearslice)
    .transition(p3.transDur)
    .style("fill", d => colormap(+d.rate));

    var rates = [].concat.apply([],p3.stRate.map(d=>d.rates));
    
    d3.select("#stateGrid").selectAll("rect")
    .data(rates)
    .style("fill", d => colormap(+d.rate));

}

function stateSelect(state){
     d3.select("#hex-"+selectedState[0])
              .attr("stroke", null);
     d3.select("#plot-"+selectedState[0])
              .attr("stroke", d3.rgb(0,0,0,p3.plotOpac));
    if(state == selectedState[0]){
        if(selectedState[1] == 1){
            selectedState[1] = 0;
            return;
        }
    }

      
    d3.select("#hex-"+state)
    .attr("stroke", d3.rgb(0,255,0))
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 5);
    d3.select("#plot-"+state)
        .attr("stroke", "blue")
    selectedState[0] = state;
    selectedState[1] = 1;
}

/* handles google link*/
function link(year, state){
    d3.select("#stateMapLink")
      .html(p3.searchLink(year, state));
}




/* onMouse() is called with mousedown (downward part of click) and
 mousemove events. The first argument is what element was under the cursor
 at the time, and the second argument is the XY position of the cursor
 within that element, which can used (if "plot" == IDspl[0]) to recover,
 via p3.plotXScale the corresponding year */
function onMouse(ID, xy) {
    var IDspl = ID.split("-"); // splits ID string at "-"s into array
    var state, year;
    console.log("onMouse: ", ID, IDspl, xy, d3.event.type);
    if(d3.event.type == "mousedown"){
        if (IDspl[0]=="plot"){
            year = Math.round(p3.plotXScale.invert(xy[0]));
            if(IDspl[1]!="bkgd" && IDspl[1]!="us"){
            state = IDspl[1];
            }
        }
        if(IDspl[0]=="grid"){
            year = IDspl[2];
            state = IDspl[1];
        }
        if(IDspl[0]=="hex"){
            state = IDspl[1];
            year = selectedYear;
        }
        yearSelect(year);
        stateSelect(state);
        link(selectedYear, selectedState[1] == 1? selectedState[0]:0); 
    }
    if(d3.event.type == "mousemove"){
        if (IDspl[0]=="plot"){
            year = Math.round(p3.plotXScale.invert(xy[0]));
        }
        if(IDspl[0]=="grid"){
            year = IDspl[2];
        }
        yearSelect(year);
        link(selectedYear, selectedState[1] == 1? selectedState[0]:0); 
    }

}

/* ------------------------- do not change anything below this line */

exports.hexWidth = hexWidth;
exports.txtWidth = txtWidth;
exports.plotOpac = plotOpac;
exports.plotStrokeWidth = plotStrokeWidth;
exports.transDur = transDur;
exports.sortBySet = sortBySet;
exports.colorBySet = colorBySet;
exports.popRowFinish = popRowFinish;
exports.caseRowFinish = caseRowFinish;
exports.popDataFinish = popDataFinish;
exports.caseDataFinish = caseDataFinish;
exports.mapData = mapData;
exports.popData = popData;
exports.caseData = caseData;
exports.stRate = stRate;
exports.usRate = usRate;
exports.searchLink = searchLink;
exports.plotWdth = plotWdth;
exports.plotHght = plotHght;
exports.plotXScale = plotXScale;
exports.popYears = popYears;
exports.finalFinish = finalFinish;
exports.yearSelect = yearSelect;
exports.onMouse = onMouse;
Object.defineProperty(exports, '__esModule', { value: true });
})));
