const TRACK_DATA_PATH = "data/TrackData.csv";
const RAIN_DATA_PATH = "data/TotalTyRain.csv";
const MAP_PATH = "data/east_asia.json";
const TW_PATH = "data/taiwan.json";

const mapX = 0;
const mapY = 0;
const mapTotalWidth = 800;
const mapTotalHeight = 560;

const rainHistoX = 0;
const rainHistoY = 0;

const rainLineX = 400;
const rainLineY = 300;

const MAP_SVG_WIDTH = 800;
const MAP_SVG_HEIGHT = 600;

const RainHisto_SVG_WIDTH = 660;
const RainHisto_SVG_HEIGHT = 300;

const RainLine_SVG_WIDTH = 300;
const RainLine_SVG_HEIGHT = 200;

// =========================== append MAP_SVG in division of #map ===================================
const MAP_SVG = d3.select(".map").append("svg")
                  .attr("width", mapTotalWidth)
                  .attr("height", mapTotalHeight);
// append rain histogram SVG in division of #rain-histo
const RAIN_HISTO_SVG = d3.select(".histo").append("svg")
                         .attr("width", RainHisto_SVG_WIDTH)
                         .attr("height", RainHisto_SVG_HEIGHT);
// append rain filterplot SVG in division of #rain-line
// const RAIN_LINE_SVG = d3.select(".filterplot").append("svg")
//                         .attr("width", RainLine_SVG_WIDTH);
const BarMarginL = 40;
const BarWidth = 8;
const RainBarH = RainHisto_SVG_HEIGHT/2 - 10;
const TyCountBarH = RainHisto_SVG_HEIGHT/2 - 24;
const year_rain_g = RAIN_HISTO_SVG.append("g");
const ty_count_g = RAIN_HISTO_SVG.append("g");
const bar_xaxis_g = RAIN_HISTO_SVG.append("g");
const rain_yaxis_g = RAIN_HISTO_SVG.append("g");
const count_yaxis_g = RAIN_HISTO_SVG.append("g");

const transition_t = d3.transition().delay(100).duration(1200);

//=============================== The Map html part ==================================
// define the projection object
let projection = d3.geoEquirectangular();
// append map group
let mapG = MAP_SVG.append("g");
let map_geo = mapG.append("g").attr('class', 'map-geo')
                  .attr("style","opacity: 0.0;")
                  .attr("transform",
                        "translate(" + mapX + "," + mapY + ")"); // group for geography of taiwan

let map_names = mapG.append("g")
                    .attr('class', 'map-name')
                    .attr("style","opacity: 0.0;"); // group for texts of county names

let map_typath = mapG.append("g").attr('class', 'map-typath')
                     .attr("style","opacity: 0.0;"); // group for typhoon paths.
let map_typoint = mapG.append("g").attr('class', 'map-typoint')
let map_tooltip = mapG.append("g")

// ====================== map drawing function =======================
function DrawAll(map_data){
  // define the projection extent
  projection.fitExtent([[0,0], [mapTotalWidth, mapTotalHeight]], map_data);

  let geoGenerator = d3.geoPath()
                       .projection(projection);
  // init
  map_geo.html("");
  map_typoint.html("");
  // draw the map by paths
  map_geo.selectAll("path")
         .data(map_data.features)
         .enter()
         .append("path")
         .attr("stroke", "white")
         .attr("fill", "darkgreen")
         // each item in taiwan.features will be as input into geoGenerator
         // and generate path descriptor.
         .attr("d", geoGenerator);
  // add county names texts
  // init
  map_names.html("");
  map_names.selectAll("text")
           .data(map_data.features)
           .enter()
           .append("text")
           .attr("text-anchor", "middle")
           .attr("alignment-baseline", "middle")
           .attr("fill", "white")
           .attr("font-size", "14px")
           .attr("font-family", "Arial")
           .attr("font-weight", "bold")
           .attr("opacity", 0.8)
           .text(function(d){
                  return d.properties.name;
                })
           .attr("transform", function(d){ // anchor text at the mid of counties
                  let centre = geoGenerator.centroid(d);
                  return "translate(" + centre + ")";
                });
  // the function of drawing the typhoon paths
  track_csv.then(Draw_Typath_on_Map);
}

function Draw_Typath_on_Map(trackdata){ // map_typath: appended from mapG for typhoon paths  
  let lineGenerator = d3.line()
                        .x(function(d){
                            let x = projection(d)[0];
                            if(x > mapTotalWidth){ x = mapTotalWidth; }
                            if(x < 0){ x = 0; }
                            // console.log(x);
                            return x;
                          })
                        .y(function(d){
                            let y = projection(d)[1];
                            if(y > mapTotalHeight){ y = mapTotalHeight; }
                            if(y < 0){ y = 0; }
                            // console.log(y);
                            return y;
                          });
  // console.table(trackdata);
  // initialize typaths group
  map_typath.html("");
  // draw typhoon paths
  // console.table(trackdata);
  // console.log(projection(trackdata[0].gps[0]))
  trackdata.forEach(data => {
    map_typath.append("path")
           .attr("d", lineGenerator(data.gps))
           .attr("fill", "none")
           .attr("stroke", "white")
           .attr("stroke-opacity", 0.1)
           .attr("stroke-width", 1);  
  });
}

// Create Typhoon dropdown list filter by year, and by Typhoon names alphebatically.
function CreateTyFilter(trackdata){
  // Create the year selection dropdown list
  let yr_arr= UniqueYear(trackdata);
  let yr_datalist = d3.select("#tyyear");
  // yr_select.append("option").attr("value", null).text("") // default is empty
  yr_datalist.selectAll("option")
             .data(yr_arr)
             .enter()
             .append("option")
             .attr("value", d => d.value);

  name_arr = UniqueName(trackdata);
  // sort typhoon trackdata by alphebatical order
  name_arr.sort((a, b) => {
    // console.log(a.Typhname);
    return a.name.localeCompare(b.name);
  });
  // Create the typhoon name searching dropdown list
  let tyname_datalist = d3.select("#typhnames");
  tyname_datalist.selectAll("option")
                 .data(name_arr)
                 .enter()
                 .append("option")
                 .attr("value", function(d){
                    return d.name;
                 });
}

// Draw Taiwan only, including county boundaries
function DrawTW(taiwan){
  // define the projection extent
  projection.fitExtent([[0,0], [mapTotalWidth, mapTotalHeight]], taiwan);

  let geoGenerator = d3.geoPath()
                       .projection(projection);
  // init
  map_geo.html("");
  map_typoint.html("");
  // draw the map by paths
  map_geo.selectAll("path")
         .data(taiwan.features)
         .enter()
         .append("path")
         .attr("stroke", "white")
         .attr("fill", "darkgreen")
         // each item in taiwan.features will be as input into geoGenerator
         // and generate path descriptor.
         .attr("d", geoGenerator);
  // add county names texts
  // init
  map_names.html("");
  // add county names
  map_names.selectAll("text")
           .data(taiwan.features)
           .enter()
           .append("text")
           .attr("font-weight", "bold")
           .attr("text-anchor", "middle")
           .attr("alignment-baseline", "middle")
           .attr("opacity", 0.6)
           .text(function(d){
                  return d.properties.NAME_2014;
                })
           .attr("transform", function(d){ // anchor text at the mid of counties
                  let centre = geoGenerator.centroid(d);
                  return "translate(" + centre + ")";
                });
  // the function of drawing the typhoon paths
  track_csv.then(Draw_Typath_on_Map);
}

function DrawEAmap(map_data){
  // define the projection extent
  projection.fitExtent([[0,0], [mapTotalWidth, mapTotalHeight]], map_data);

  let geoGenerator = d3.geoPath()
                       .projection(projection);
  // init
  map_geo.html("");
  map_typoint.html("");
  // draw the map by paths
  map_geo.selectAll("path")
         .data(map_data.features)
         .enter()
         .append("path")
         .attr("stroke", "white")
         .attr("fill", "darkgreen")
         // each item in taiwan.features will be as input into geoGenerator
         // and generate path descriptor.
         .attr("d", geoGenerator);
  // add county names texts
  // init
  map_names.html("");
  map_names.selectAll("text")
           .data(map_data.features)
           .enter()
           .append("text")
           .attr("text-anchor", "middle")
           .attr("alignment-baseline", "middle")
           .attr("fill", "white")
           .attr("font-size", "14px")
           .attr("font-family", "Arial")
           .attr("font-weight", "bold")
           .attr("opacity", 0.8)
           .text(function(d){
                  return d.properties.name;
                })
           .attr("transform", function(d){ // anchor text at the mid of counties
                  let centre = geoGenerator.centroid(d);
                  return "translate(" + centre + ")";
                });
}

function DrawTWmap(taiwan){
  // define the projection extent
  projection.fitExtent([[0,0], [mapTotalWidth, mapTotalHeight]], taiwan);

  let geoGenerator = d3.geoPath()
                      .projection(projection);
  // init
  map_geo.html("");
  map_typoint.html("");
  // draw the map by paths
  map_geo.selectAll("path")
        .data(taiwan.features)
        .enter()
        .append("path")
        .attr("stroke", "white")
        .attr("fill", "darkgreen")
        // each item in taiwan.features will be as input into geoGenerator
        // and generate path descriptor.
        .attr("d", geoGenerator);
  // add county names texts
  // init
  map_names.html("");
  // add county names
  map_names.selectAll("text")
          .data(taiwan.features)
          .enter()
          .append("text")
          .attr("font-weight", "bold")
          .attr("fill", "white")
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "middle")
          .attr("opacity", 0.6)
          .text(function(d){
                  return d.properties.NAME_2014;
                })
          .attr("transform", function(d){ // anchor text at the mid of counties
                  let centre = geoGenerator.centroid(d);
                  return "translate(" + centre + ")";
                });
}

// =========== first loading of map part ============
const ea_json = d3.json(MAP_PATH);
const tw_json = d3.json(TW_PATH);
const track_csv = d3.csv(TRACK_DATA_PATH, TrackDataRowConvert);
// d3.json(MAP_PATH).then(DrawAll);
ea_json.then(DrawAll);
track_csv.then(CreateTyFilter);

// ========  Fade in effect ========
// init the opacity
map_geo.style("opacity", 0.0);
map_names.style("opacity", 0.0);
map_typath.style("opacity", 0.0);
// the first fade-in effect when loading the webpage
map_geo.transition().delay(0)
       .duration(1000)
       .style("opacity", 1);
map_names.transition().delay(1000)
         .duration(600)
         .style("opacity", 1);
map_typath.transition().delay(1600)
          .duration(400)
          .style("opacity", 1);

// ============ load raindata ==============
d3.csv(RAIN_DATA_PATH, RainDataRowConvert).then(data => {
  // console.log(data);
  // ============== number of typhoons per year histogram ===================
  // console.log(YearTotalTyRain(data));
  // console.log(CountYearTy(data));
  let YearTotalRain = YearTotalTyRain(data);
  let YearTyNum = CountYearTy(data);
  let rain_max = FindRainMax(YearTotalRain);
  let cnt_max = FindCountMax(YearTyNum);
  // console.log(cnt_max);
  // console.log(rain_max);
  const rainYscaler = d3.scaleLinear()
                      .domain([0, rain_max])
                      .range([RainBarH, 0])
  const countYscaler = d3.scaleLinear()
                        .domain([0, cnt_max])
                        .range([TyCountBarH, 0])
  const reverse_countYscaler = d3.scaleLinear()
                                  .domain([0, cnt_max])
                                  .range([0, TyCountBarH])
  // create colormap scaler for rain amount
  const RainBarCmap = d3.scaleSequential()
                        .domain([rain_max, 0])
                        .interpolator(d3.interpolateOrRd);
  // create colormap scaler for typhoon counting
  const TyCountBarCmap = d3.scaleSequential()
                        .domain([cnt_max, 0])
                        .interpolator(d3.interpolateBlues);
    /*
    Be careful here: if you append your brush after your data points,
    the brush overlay will catch all of the pointer events,
    and your tooltips will disappear on hover.
    You want to append the brush before your data points,
    so that pointer events on the data generate a tooltip, and those on the overlay generate a brush. 
  */ 
  const RainBartooltip = RAIN_HISTO_SVG.append("g");
  const CountBartooltip = RAIN_HISTO_SVG.append("g");
  const RainBarBrushX = year_rain_g.append("g");
  const CountBarBrushX = ty_count_g.append("g");
  // ========== create band scale object, x-scaler ============
  const bandScale = d3.scaleBand()
                      .domain(YearTotalRain.map(d => d.year))
                      .range([0, 600])
                      .paddingOuter(0.3)
                      .paddingInner(0.2);
  // ========== x-axis ==========
  const RainXaxis = d3.axisBottom(bandScale);
  bar_xaxis_g.attr("transform",
                   "translate(" + (BarMarginL-4) + ", 0)")
             .call(RainXaxis)
             .selectAll("text")
             .attr("color", "white")
             .attr("font-size","10px")
             .attr("x", -RainBarH - 14)
             .attr("y", 0)
             .attr("text-anchor", "middle")
             .attr("transform","rotate(-90)");
  // x label
  bar_xaxis_g.append("text")
             .attr("x", RainHisto_SVG_WIDTH-60)
             .attr("y", RainHisto_SVG_HEIGHT-20)
             .attr("text-anchor","end")
             .text("x-axis: year")
             .attr("fill", "white")
             .attr("font-size", "18px");
  // ========= y axis ==========
  // create y-axis object of total rain
  let rainYaxis = d3.axisLeft(rainYscaler)
                    .ticks(7); // set number of ticks
  rain_yaxis_g.attr("transform",
                    "translate("+ (BarMarginL) + "," + "0)")
              .attr("color", "white")
              .call(rainYaxis);
  // rain y-axis label
  rain_yaxis_g.append("text")
    .attr("x", RainHisto_SVG_WIDTH/2-BarMarginL)
    .attr("y", 20)
    .attr("text-anchor","middle")
    .text("Total Precipitation [mm / year]")
    .attr("fill", "white")
    .attr("font-size", "18px");
  // create y-axis object of typhoon total counts
  let countYaxis = d3.axisLeft(reverse_countYscaler)
                     .ticks(7); // set number of ticks
  count_yaxis_g.attr("transform",
                     "translate("+ (BarMarginL) + "," + (RainHisto_SVG_HEIGHT/2 + 20) + ")")
              .attr("color", "white")
              .call(countYaxis);
  // count y-axis label
  count_yaxis_g.append("text")
    .attr("x", RainHisto_SVG_WIDTH/2-BarMarginL)
    .attr("y", 120)
    .attr("text-anchor","middle")
    .text("Number of Typhoons [#]")
    .attr("fill", "white")
    .attr("font-size", "18px");
  // =============== barplots =================
  // barplot of total rain by years
  let RainBar = year_rain_g.selectAll("rect").data(YearTotalRain)
                .enter().append("rect")
                .attr("y",  function(d){
                  // console.log(d.rain);
                  return rainYscaler(d.rain);
                })
                .attr("x",  function(d,i){
                  return BarMarginL + bandScale(d.year);
                })
                .attr("height", 0)
                .attr("width", BarWidth)
  year_rain_g.selectAll("rect").data(YearTotalRain).transition(transition_t)
             .attr("height", function(d){
                      return RainBarH - rainYscaler(d.rain);
                    })
             .attr("fill", function(d){
                      return RainBarCmap(d.rain);
                    })
             .attr("opacity", 0.6);
  // barplot of number of typhoon by years
  // console.log(YearTyNum[0])
  let CountBar = ty_count_g.selectAll("rect").data(YearTyNum)
                          .enter().append("rect")
                          .attr("y", function(d){
                                // console.log(d.rain);
                                return RainHisto_SVG_HEIGHT/2 + 20;
                              })
                          .attr("x", function(d,i){
                                return BarMarginL + bandScale(d.year);
                              })
                          .attr("height", 0)
                          .attr("width", BarWidth);

  ty_count_g.selectAll("rect").data(YearTyNum).transition(transition_t)
                          .attr("height", function(d){
                                // console.log(d.rain);
                                return TyCountBarH - countYscaler(d.num);
                              })
                          .attr("fill", function(d){
                                return TyCountBarCmap(d.num);
                              })
                          .attr("opacity", 0.6);

  // ================ tooltips one the barcharts ================================

  let rainbartip = d3.tip().attr("class", "rainbar-tip") // assign class name
              // content of tooltip, 'd' is data item sent to tooltip.
                 .html(d => (d.rain.toFixed(1) + " mm"));

  RainBartooltip.call(rainbartip); // enable tooltip in year_rain barchart
  // event listener
  RainBar.on("mouseover", rainbartip.show)
         .on("mouseout", rainbartip.hide);

  let countbartip = d3.tip().attr("class", "rainbar-tip") // assign class name
              // content of tooltip, 'd' is data item sent to tooltip.
                 .html(d => (d.num) + " typhoons");

  CountBartooltip.call(countbartip); // enable tooltip in year_rain barchart
  // event listener
  CountBar.on("mouseover", countbartip.show)
          .on("mouseout", countbartip.hide);
  // ========================= brushX functions ============================
  // ======= Note that the brush layer lives behind the data points! =======
  // brushX for rain barchart
  let rain_brushX = d3.brushX()
                       .extent([ [BarMarginL-10, 0],
                                 [RainHisto_SVG_WIDTH-10, RainHisto_SVG_HEIGHT/2 -10]
                               ]) // brushable area
                       .on("start", RainBarBrushed)
                       .on("brush", RainBarBrushed)
                       .on("end", RainBarBrushEnd);
  RainBarBrushX.call(rain_brushX);
  // brushX for count barchart
  let count_brushX = d3.brushX()
                       .extent([ [BarMarginL-10, RainHisto_SVG_HEIGHT/2 + 20],
                                 [RainHisto_SVG_WIDTH-10, RainHisto_SVG_HEIGHT]
                               ]) // brushable area
                       .on("start", CountBarBrushed)
                       .on("brush", CountBarBrushed)
                       .on("end", CountBarBrushEnd);
  CountBarBrushX.call(count_brushX);

  let filtered_countdata = []; // to store the filtered "years" from the count barchart
  let filtered_raindate = []; // to store the filtered "years" from the rain barchart
  let filtered_rainname = [];
  let filtered_rain = [];

  function CountBarBrushed(){
    // console.log(data); // accessible
    let extent = d3.event.selection; // [left-x , right-x]
    let brushed_data = []; // filtered count barchart [{year}...]
    let total_num = 0;
    CountBar.classed("selected_countbar", function(d){ 
        let is_selected = false;
        is_selected = extent[0] <= (BarMarginL + bandScale(d.year)) &&
                      extent[1] >= (BarMarginL + bandScale(d.year)) && 
                      (d.num > 0);
        // console.log(is_selected);
        if(is_selected){
            // console.log(d.arr); // OK
            total_num += d.num;
            brushed_data.push(d.arr);
        }
        return is_selected; // boolean
    });
    // console.log(brushed_data); // array
    // console.log(filter_tyname); // array
    // console.log(filter_rain); // array
    filtered_countdata = [].concat(...brushed_data); // reduce to 1D array of each 1D array element
    filtered_countdata.push(["Total:",total_num]);
  } // end of brush function of count barchart

  function CountBarBrushEnd(){
    //init
    d3.select(".table").html("");
    if(filtered_countdata.length>0){
      const table = d3.select('.table').append('table')
                      .style("display", "inline-block")
                      .style("opacity", 0)
                      .style("border-collapse", "collapse")
                      .style("border", "2px white solid"); // for number of typhoon count barchart table after filter
      // console.log(filtered_countdata);
      // ref: https://codepen.io/whitejacques/pen/RYVpKZ?editors=0010
      let HEADERS = ["Formed Date", "Typhoon Name", "Total Rain [mm]"]
      // headers
      table.append("thead").append("tr")
          .selectAll("th")
          .data(HEADERS)
          .enter().append("th")
          .text(d => d)
          .style("color", "white")
          .style("border", "1px white solid")
          .style("padding", "5px")
          .style("font-weight", "bold");

      // data
      table.append("tbody")
          .selectAll("tr").data(filtered_countdata)
          .enter().append("tr")
          .selectAll("td")
          .data(function(d){return d;})
          .enter().append("td")
          .style("border", "1px white solid")
          .style("padding", "5px")
          .on("mouseover", function(){
                d3.select(this).style("background-color", "darkblue");
              })
          .on("mouseout", function(){
                d3.select(this).style("background-color", "black");
              })
          .text(function(d){return d;})
          .style("color", "white")
          .style("font-size", "12px");
      // console.log("brush end.");
      table.transition().delay(100)
                .duration(1000)
                .style("opacity", 1);
    }
  } // end of brushEnd function of count barchart

  function RainBarBrushed(){
    let extent = d3.event.selection; // [left-x , right-x]
    let brushed_date = []; // filtered rain barchart [...[year-month]...]
    let brushed_name = []; // filtered rain barchart [...[name]...]
    let brushed_rain = []; // filtered rain barchart [...[rain]...]
    RainBar.classed("selected_rainbar", function(d){ 
        let is_selected = false;
        is_selected = extent[0] <= (BarMarginL + bandScale(d.year)) &&
                      extent[1] >= (BarMarginL + bandScale(d.year)) && 
                      (d.rain > 0);
        // console.log(is_selected);
        if(is_selected){
            // console.log(d.arr); // OK
            brushed_date.push(d.arr[0]);
            brushed_name.push(d.arr[1]);
            brushed_rain.push(d.arr[2]);
        }
        return is_selected; // boolean
    });
    filtered_raindate = [].concat(...brushed_date); // reduce to 1D array of each 1D array element
    filtered_rainname = [].concat(...brushed_name); // reduce to 1D array of each 1D array element
    filtered_rain = [].concat(...brushed_rain); // reduce to 1D array of each 1D array element
    // console.log(brushed_date);
    // console.log("rain bar brushed");
  } // end of brush function of rain barchart

  function RainBarBrushEnd(){
    // init
    d3.select(".filterbar").html("");
    if(filtered_rain.length > 0){
      // console.log(filtered_raindate); // date array: year-month
      // console.log(filtered_rainname); // typhoon names array
      // console.log(filtered_rain); // rain of typhoon array
      // ======= barchart plot =======
      // console.log(filtered_rainname.length);
      const filtered_barH = 8; // vertical barchart, barwidth = height
      const filtered_barMarginL = 40; // vertical barchart, barwidth = height
      const filtered_barMarginT = 10; // vertical barchart, barwidth = height
      const filteredXscaler = d3.scaleLinear()
                                .domain([0, d3.max(filtered_rain)])
                                .range([0, 200]); // to scale barwidth
      const filtered_SVG = d3.select(".filterbar").append("svg")
                            .attr("width", 300)
                            .attr("height", filtered_rainname.length*filtered_barH*2 +filtered_barMarginT*4);
      const filtered_bar_g = filtered_SVG.append("g"); // rectangles
      const filtered_value_g = filtered_SVG.append("g"); // tooltip for rectangles values
      const filtered_xaxis_g = filtered_SVG.append("g"); // x-axis
      const filtered_yaxis_g = filtered_SVG.append("g"); // y-axis (texts of typhoon years)
      filtered_yaxis_g.selectAll("text").data(filtered_raindate)
                                .enter().append("text")
                                .attr("x", filtered_barMarginL)
                                .attr("y", function(d,i){ 
                                  return i*filtered_barH*2 + filtered_barH + filtered_barMarginT; })
                                .text(d => d)
                                .attr("text-anchor", "end")
                                .attr("fill", "white")
                                .attr("font-size", "12px");

      filtered_bar_g.selectAll("rect").data(filtered_rain)
                    .enter().append("rect")
                    .attr("x", filtered_barMarginL+10)
                    .attr("y", function(d,i){
                       return i*filtered_barH*2 + filtered_barMarginT; })
                    .attr("height", filtered_barH)
                    .attr("fill", "white");
      filtered_bar_g.selectAll("rect").data(filtered_rain).transition(transition_t)
                    .attr("width", d => filteredXscaler(d));

      filtered_value_g.selectAll("text").data(filtered_rain)
                    .enter().append("text")
                    .text(d => d)
                    .attr("x", d => filtered_barMarginL+20+filteredXscaler(d))
                    .attr("y", function(d,i){
                       return i*filtered_barH*2 + filtered_barH + filtered_barMarginT; })
                    .attr("fill", "white")
                    .attr("font-weight", "bold")
                    .attr("font-size", "12px");

  let xaxis = d3.axisBottom(filteredXscaler)
                .ticks(7); // set number of ticks
  filtered_xaxis_g.attr("transform",
                        "translate("+ (filtered_barMarginL+10) + "," 
                                    + (filtered_rainname.length*filtered_barH*2 +filtered_barMarginT) + ")")
                  .attr("color", "white")
                  .call(xaxis)
                    .selectAll("text")
                    .attr("x", 8).attr("y", 10)
                    .attr("transform","rotate(30)");
      // console.log(d3.max(filtered_rain));
      // console.log("rain bar end");
      // draw filtered data barchart
    }
  } // end of brushEnd function of rain barchart

}) // end of d3csv(rain.csv)


// ======= Functional Ones ==========
function SetFilterOff(off=true){ // set state of the input boxes
  document.getElementById("year-input-start").disabled = off;
  document.getElementById("year-input-end").disabled = off;
  document.getElementById("name-input").disabled = off;
}

// ======= Filtering Event =======
function ChkTyyear(){
  // Get the checkbox
  let is_tw_map = document.getElementById("focus-mode").checked;
  let yr_list = [].slice.call(document.getElementById("tyyear").options)
                        .map(function(option){
                              return option.value;
                             });
  let start_yr = document.getElementById("year-input-start").value //retrieve start year
  let end_yr = document.getElementById("year-input-end").value // retrieve end year

  // boolean: if is valid
  let start_yr_found = yr_list.includes(start_yr);
  let end_yr_found = yr_list.includes(end_yr);
  let both_empty = (start_yr === "" && end_yr === "");
  let both_found = start_yr_found && end_yr_found;

  // console.log(start_yr_found);
  // if not using year filtering function, and Foucs mode is off, then draw east asia map
  if(is_tw_map === false){
    if(both_empty || both_found){
      // console.log(start_yr); // (empty)
      // console.log(typeof start_yr); // string
      UpdatePath(start_yr, end_yr, ea_json);
    }
  } else { // is in Taiwan view
    // if not using year filtering function, and Foucs mode is ON, then draw taiwan map
    if(both_empty || both_found){
      // console.log(start_yr); // (empty)
      // console.log(typeof start_yr); // string
      UpdatePath(start_yr, end_yr, tw_json);
    }
  }
}

function UpdatePath(start_year, end_year, map_data){
  // ensure effective start, end year input
  let both_empty = (start_year === "" && end_year === "");
  // rearrange the order
  if(end_year - start_year < 0){
    let temp = start_year;
    start_year = end_year;
    end_year = temp;
  }
  map_data.then(RedrawPath);
  function RedrawPath(map_data){
    // define the projection extent
    projection.fitExtent([[0,0], [mapTotalWidth, mapTotalHeight]], map_data);
    let lineGenerator = d3.line()
                          .x(function(d){
                              let x = projection(d)[0];
                              if(x > mapTotalWidth){ x = mapTotalWidth; }
                              if(x < 0){ x = 0; }
                              // console.log(x);
                              return x;
                            })
                          .y(function(d){
                              let y = projection(d)[1];
                              if(y > mapTotalHeight){ y = mapTotalHeight; }
                              if(y < 0){ y = 0; }
                              // console.log(y);
                              return y;
                            });

    // initialize typaths group
    map_typath.html("");
    map_typoint.html("");
    // console.log(start_year);
    // console.log(end_year);
    track_csv.then(data=>{
      data.forEach(d => {
        if(both_empty){ // not filtering, then use default select-all gps array
          // console.log(d.gps.length);
          map_typath.append("path")
                    .attr("d", lineGenerator(d.gps))
                    .attr("fill", "none")
                    .attr("stroke", "white")
                    .attr("stroke-opacity", 0.1)
                    .attr("stroke-width", 1);
        }
        // console.log(d); // each row['Typhname', 'Date', 'Time', 'gps']
        let data_yr = d.Date.substring(0,4); // get year string of data
        // console.log(data_yr);
        if(data_yr - start_year>=0 && data_yr - end_year<=0){ // if data year is between start and end year
          // console.log(d.Typhname);
          // console.log(d.length);
          // console.log(d.gps); // array for each typhoon of filtered year.
          // console.log(d.gps.length);
          // append dot at gap spot
          d.gps.forEach(d => {
            // console.log(d); // every [lon, lat] in [[lon,lat], ...]
            map_typoint.append("circle")
                       .attr("cx", projection(d)[0])
                       .attr("cy", projection(d)[1])
                       .attr("r", 2.0)
                       .attr("opacity", 0.5)
                       .attr("fill", "white")
          })
          map_typath.append("path")
                    .attr("d", lineGenerator(d.gps))
                    .attr("fill", "none")
                    .attr("stroke", "white")
                    .attr("stroke-opacity", 0.5)
                    .attr("stroke-width", 1.5);
        }
      });
    });
  }
}

function ChkTyname(){
  // init
  d3.select(".name-detail").html("");
  // Get the checkbox
  let is_tw_map = document.getElementById("focus-mode").checked; // boolean
  let name_list = [].slice.call(document.getElementById("typhnames").options)
                          .map(function(option){
                              return option.value;
                             });
  let name_input = document.getElementById("name-input").value //retrieve start year
  // boolean: if is valid
  let empty_name = (name_input === "");
  let name_found = name_list.includes(name_input); // find if it's in the datalist
  // console.log(name_list);
  // console.log(name_input);

  // draw the formed date, location table in the plot zone
  if(name_found){
    DetailNameInfo(name_input);
  }
  if( (empty_name || name_found) && is_tw_map){
    tw_json.then(RedrawPathByName);
  }
  if( (empty_name || name_found) && (is_tw_map!=true) ){
    ea_json.then(RedrawPathByName);
  }

  function RedrawPathByName(map_data){
    // define the projection extent
    projection.fitExtent([[0,0], [mapTotalWidth, mapTotalHeight]], map_data);
    let lineGenerator = d3.line()
                          .x(function(d){
                              let x = projection(d)[0];
                              if(x > mapTotalWidth){ x = mapTotalWidth; }
                              if(x < 0){ x = 0; }
                              // console.log(x);
                              return x;
                            })
                          .y(function(d){
                              let y = projection(d)[1];
                              if(y > mapTotalHeight){ y = mapTotalHeight; }
                              if(y < 0){ y = 0; }
                              // console.log(y);
                              return y;
                            });

    // initialize typaths group
    map_typath.html("");
    map_typoint.html("");
    // console.log(start_year);
    // console.log(end_year);
    track_csv.then(data => {
      data.forEach(d => {
        if(name_input === ""){ // not filtering, then use default select-all gps array
          // console.log(d.Typhname);
          map_typath.append("path")
                    .attr("d", lineGenerator(d.gps))
                    .attr("fill", "none")
                    .attr("stroke", "white")
                    .attr("stroke-opacity", 0.1)
                    .attr("stroke-width", 1);
        }
        // console.log(d); // each row['Typhname', 'Date', 'Time', 'gps']
        let data_name = d.Typhname.substr(5);
        if(name_input === data_name){
          // console.log(d.Typhname);
          // append dot at gap spot
          d.gps.forEach(d => {
            // console.log(d); // every [lon, lat] in [[lon,lat], ...]
            map_typoint.append("circle")
                       .attr("cx", projection(d)[0])
                       .attr("cy", projection(d)[1])
                       .attr("r", 2.5)
                       .attr("opacity", 0.8)
                       .attr("fill", "white")
          })

          map_typath.append("path")
                    .attr("d", lineGenerator(d.gps))
                    .attr("fill", "none")
                    .attr("stroke", "white")
                    .attr("stroke-opacity", 0.8)
                    .attr("stroke-width", 2);
          let tip = d3.tip().attr('class', 'map-tooltip') // content of tooltip, 'd' is data item sent to tooltip.
                      .html("Year/Name: <br/>" + d.Typhname);
          map_tooltip.call(tip); // enable tooltip
              // event listener
          map_typath.on("mouseover", function(d){
            let x = d3.event.x;
            let y = d3.event.y;
            // console.log(x,y);
            tip.show(d);
            tip.style('top', y);
            tip.style('left', x);
          })
                    .on("mouseout", tip.hide);
        }
      });
    });
  }

  function DetailNameInfo(typhname){
    d3.select(".name-detail").append("text").attr("class", "big-name")
      .text(typhname[0] + typhname.substr(1).toLowerCase())
      .attr("x", 0).attr("y", 0);
    let table = d3.select('.name-detail').append('table').attr("class","name-table")
                      .style("display", "inline-block")
                      .style("opacity", 1)
                      .style("border-collapse", "collapse")
                      .style("border", "2px white solid"); // for number of typhoon count barchart table after filter
    // console.log(filtered_countdata);
    // ref: https://codepen.io/whitejacques/pen/RYVpKZ?editors=0010
    let header = ["Formed Date", "Formed Location"]
    // headers
    table.append("thead").append("tr")
        .selectAll("th")
        .data(header)
        .enter().append("th")
        .text(d => d)
        .style("border", "1px white solid")
        .style("padding", "5px")
        .style("font-weight", "bold");

    track_csv.then(data =>{ // array of objects
      // search for by typhoon name
      data.forEach(item =>{
        // console.log(item);
        if(item.Typhname.substr(5) === typhname){
          // console.log(typhname);
          // data
          let t_data = [item.Date, item.gps[0]];
          table.append("tbody")
               .selectAll("td").data(t_data)
               .enter().append("td")
               .style("border", "1px white solid")
               .style("padding", "5px")
               .on("mouseover", function(){
                    d3.select(this).style("background-color", "darkblue");
                  })
               .on("mouseout", function(){
                    d3.select(this).style("background-color", "black");
                  })
               .text(function(d){return d;})
               .style("font-size", "12px");

          // d3.select(".name-detail").append("text")
          //   .text("Formed Date: " + item.Date);
          // d3.select(".name-detail").append("text")
          //   .text("Formed Location: " + "(" + item.gps[0][0] + ", " + item.gps[0][1] + ")");
        }
      }); // end of forEach
    }); // end of track_csv.then...
  } // end of function DetailNameInfo
}

// the fading transition when switch the 'focus-mode'
async function UpdateMap(){
  // Get the checkbox
  let checkBox = document.getElementById("focus-mode");

  // turn off filtering function when transition
  SetFilterOff();

  // If the checkbox is checked, display the output text
  if (checkBox.checked == true){
    // the fade out effect
    map_typath.transition().delay(0)
              .duration(200)
              .style("opacity", 0);
    map_typoint.transition().delay(0)
               .duration(200)
               .style("opacity", 0);
    map_names.transition().delay(200)
             .duration(500)
             .style("opacity", 0);
    map_geo.transition().delay(700)
           .duration(500)
           .style("opacity", 0);
    // time sleep
    await Sleep(1200);
    // switch the view to taiwan, keep the filtered typhoon paths
    ChkTyyear();
    ChkTyname();
    tw_json.then(DrawTWmap);
    // adjust linewidth and point radius
    // fade in
    map_geo.transition().delay(400)
           .duration(2000)
           .style("opacity", 1);
    map_names.transition().delay(2400)
             .duration(800)
             .style("opacity", 1);
    map_typath.transition().delay(3200)
              .duration(600)
              .style("opacity", 1);
    map_typoint.transition().delay(3200)
               .duration(400)
               .style("opacity", 1);
  } else { // uncheck the box
    // time sleep for waiting the slider to move.
    await Sleep(400);
    // fade-out effect
    map_typoint.transition().delay(0)
               .duration(400)
               .style("opacity", 0);
    map_typath.transition().delay(200)
              .duration(400)
              .style("opacity", 0);
    map_names.transition().delay(400)
             .duration(400)
             .style("opacity", 0);
    map_geo.transition().delay(800)
           .duration(400)
           .style("opacity", 0);
    // time sleep
    await Sleep(1600);
    // redraw the map, keep the filtered typhoon paths
    ChkTyyear();
    ChkTyname();
    ea_json.then(DrawEAmap);
    // fade in
    map_geo.transition().delay(0)
           .duration(1000)
           .style("opacity", 1);
    map_names.transition().delay(1000)
             .duration(1000)
             .style("opacity", 1);
    map_typath.transition().delay(2000)
              .duration(1000)
              .style("opacity", 1);
    map_typoint.transition().delay(2000)
              .duration(400)
              .style("opacity", 1);
  }
  // turn on filter
  SetFilterOff(false);
}

// ============== other functions ================
// time sleep function (async function)
function Sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// reset-map button
function ResetMap(){
  document.getElementById("focus-mode").checked = false; // reset slider
  // reset filter inputs
  document.getElementById("name-input").value = "";
  document.getElementById("year-input-start").value = "";
  document.getElementById("year-input-end").value = "";
  //redraw the map
  ea_json.then(DrawAll);
  // reset name plot table
  d3.select(".name-detail").html("");
  d3.select(".big-name").html("");
}

// reset-plot button
function ResetPlots(){
  // To reset the brush: selection.call(brush.move, null);
  d3.select(".table").html("");
  d3.select(".filterbar").html("");
  d3.select(".name-detail").html("");
  d3.select(".big-name").html("");
}

// ========== Data processing functions =============
// convert string array to float array
function strArr2Value(str_arr){
  value_arr = [];
  res_arr = []
  str_arr = str_arr.replaceAll('[', ""); // remove all '['
  str_arr = str_arr.replaceAll(']', ""); // remove all ']'
  str_arr = str_arr.replaceAll(/\s/g, ""); // remove all whitespaces
  str_arr = str_arr.split(",") // split by ',' and this returns a num-string array
  value_arr = str_arr.map(function(item){
                            return parseFloat(item);
                          }) // convert to floats, this returns 1D float array
  for(let i=0;i<(value_arr.length);i+=2){
    res_arr.push([value_arr[i], value_arr[i+1]]);
  }
  return res_arr;
}

// conver string to value whlie reading every data record
function TrackDataRowConvert(d){
  let value_arr = strArr2Value(d.gps);
  return{
      Typhname: d.Typhname,
      Date: d.Date,
      Time: d.Time,
      gps: value_arr
  };
}

// convert and preprocessing of the raindata csv file
function RainDataRowConvert(d){
  return{
    yrname: d.yrname,
    month: d.month,
    rainsum: parseFloat(d.rainsum)
  };
}

function UniqueYear(d){ // d = large array input
  let yr_list = [];
  let yr = d[0].Date.substring(0,4);
  yr_list.push({value: yr,
                text: yr}
              );
  // console.log(yr);
  for(let i=1;i<d.length;i++){
    if(yr != d[i].Date.substring(0,4)){
      yr_list.push({value: d[i].Date.substring(0,4),
                    text: d[i].Date.substring(0,4)});
      yr = d[i].Date.substring(0,4);
    }
  }
  return yr_list;
}

function UniqueName(d){ // d = large array input
  let name_list = [];
  // console.log(d);
  for(let i=0;i<d.length;i++){
    let data_name = d[i].Typhname.substr(5);
    // console.log(data_name);

    // use Array.some(d=> d.property ?= property of another obj)
    let existed = name_list.some(obj => obj.name === data_name);
    if(existed === false){
      name_list.push({name: data_name});
    }
  }
  return name_list;
}

function YearTotalTyRain(d){
  let yr_list = [];
  // console.log(d[0]);
  for(let i=0;i<d.length;i++){
    let data_yr = d[i].yrname.substring(0,4);
    // use Array.some(d=> d.property ?= property of another obj)
    let existed = yr_list.some(obj => obj.year === data_yr);
    if(existed === false){
      yr_list.push({year: data_yr,
                    rain: d[i].rainsum,
                    arr:[ 
                          [data_yr+'-'+d[i].month],
                          [d[i].yrname.substr(5)],
                          [d[i].rainsum]
                        ]
                   });
    } else {
      let index = yr_list.map(obj => obj.year).indexOf(data_yr);
      yr_list[index].rain += d[i].rainsum;
      yr_list[index].arr[0].push(data_yr+'-'+d[i].month);
      yr_list[index].arr[1].push(d[i].yrname.substr(5));
      yr_list[index].arr[2].push(d[i].rainsum);
    }
  }
  return yr_list;
}

function CountYearTy(d){
  let yr_list = [];
  let existed = false;
  for(let i=0;i<d.length;i++){
    let data_yr = d[i].yrname.substring(0,4);
    // use Array.some(d=> d.property ?= property of another obj)
    existed = yr_list.some(obj => obj.year === data_yr);
    if(existed === false){
      yr_list.push({year: data_yr,
                    num: 1,
                    arr:[ [ data_yr+'-'+d[i].month,
                            d[i].yrname.substr(5),
                            d[i].rainsum            ]
                        ]
                  });
    } else {
      let index = yr_list.map(obj => obj.year).indexOf(data_yr);
      yr_list[index].num += 1;
      yr_list[index].arr.push([data_yr+'-'+d[i].month, d[i].yrname.substr(5), d[i].rainsum]);
    }      
  }
  return yr_list;
}

function FindRainMax(d){
  let max = 0;
  d.forEach(data => {
    if(data.rain > max){
      max = data.rain;
    }
  })
  return max;
}

function FindCountMax(d){
  let max = 0;
  d.forEach(data => {
    if(data.num > max){
      max = data.num;
    }
  })
  return max;
}