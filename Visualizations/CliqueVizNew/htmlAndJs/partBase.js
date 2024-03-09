function addCheck(tissues) {
  var cases = tissues; //= this.allData["tissues"]
  var html = "";
  //html+= '<div id="nr'+t+'" style="float: none">'+t+'. We have <span class="number-display"></span> cliques.</div>'
  html+='<div class="multiselect">'
  html+='  <div class="selectBox" onclick="showCheckboxes()">'
  html+='    <select><option>Select tissues</option></select>'
  html+='<div class="overSelect"></div> </div>'
  html+='  <div id="checkboxes">'
      // <label for="one">
      //   <input type="checkbox" id="one" />First checkbox</label>
      // <label for="two">
      //   <input type="checkbox" id="two" />Second checkbox</label>
      // <label for="three">
      //   <input type="checkbox" id="three" />Third checkbox</label>
  _.each(cases.sort(), function (t) {
        html +=
          '<label for="'+t+'"><input type="checkbox" name="checkGroup" class="myTissueTick" id="' +
          t +
          '" value="' +
          t +
          '"  onclick="filter();" checked="checked"> ' +
          t +'</label>';
      });
 
  // _.each(cases.sort(), function (t) {
  //   html +=
  //     '<input type="checkbox" name="checkGroup" class="myTissueTick" id="' +
  //     t +
  //     '" value="' +
  //     t +
  //     '"  onclick="filter();" checked="checked"> ' +
  //     t;
  // });
  html+='</div></div>'
  $("#tissueSelect").append(html);
}
//vecais html += '<input type="checkbox" name="checkGroup" class="myTissueTick" id="' + t + '" value="' + t + '"  onclick="filter();" checked="checked"> '+ t







var expanded = false;
function showCheckboxes() {
  var checkboxes = document.getElementById("checkboxes");
  if (!expanded) {
    checkboxes.style.display = "block";
    expanded = true;
  } else {
    checkboxes.style.display = "none";
    expanded = false;
  }
}











function filter() {
  //called on change event of every checkbox

  checked = getCheckedByName("checkGroup");
  console.log(checked);
  container.showFiltered(checked);
  //sakt filtret
}
function getCheckedByName(name) {
  //returns a list of tissues, that are currently selected
  var checked = [];

  $("input[name = " + name + "]:checked").each(function () {
    checked.push($(this).attr("value"));
  });

  return checked;
}

function uncheckAllTicks() {
  let iii = 9;
  $(".myTissueTick").each(function () {
    $(this).prop("checked", false);
  });
  $(".myClusterTick").each(function () {
    $(this).prop("checked", false);
  });
}

class myContainer {
  constructor(playground) {
    this.type = "MyContainer";
    this.allData; //for all chrs
    this.data; //for current chromosome
    this.curChr; //currently selected chromosome
    this.playground = playground;
    this.d = {}; //dimensions
    this.addButton();
    this.ndx;
  }

  doTheFullReset() {
    this.myScatterPlot.filterAll();
    this.myCliqueLociPlotB.filterAll();

    dc.redrawAll();
    dc.renderAll();
  }

  setData(data) {
    //reads data, the whole .json file, for all chromosomes
    this.allData = data; //data for all chromosomes, the whole file
    console.log("allData is set");
    console.log(this.allData);
    this.header = [
      "ID",
      "A",
      "B",
      "C",
      "a",
      "b",
      "tisBitmap",
      "tisCount",
      "clusterID",
    ];
    //$('#selectionDiv').css('display', 'none');
    //$('#myNetwork').css('visibility', 'visible');

    this.startMagic();
  }

  startMagic() {
    console.log("Magic is starting now");
    this.cols = [
      "#0d0887",
      "#41049d",
      "#6a00a8",
      "#8f0da4",
      "#b12a90",
      "#cc4778",
      "#e16462",
      "#f2844b",
      "#fca636",
      "#fcce25",
      "#f0f921",
    ];

    this.showChrSelect(); //creates chr dropdown and selects chr6 automatically
    this.afterShowChrSelect();
  }

  addChrSelection() {
    var self = this;
    //var chrSelect = $('#chrSelect');
    var chrSelect = document.getElementById("chrSelect");
    _.each(self.allData.chrs, function (t) {
      chrSelect.options.add(new Option(t, t));
    });
  }

  resetData(ndxxxx) {
    let x = ndxxxx;
    ndxxxx.remove(() => true);
  }

  setMaxGiantID(newChr) {
    //////////
    //curGiantClusterID <- ID int of the biggest cluster
    ////
    let len = this.allData.chrClusters[newChr].length;
    let freq = new Array(len).fill(0);
    _.each(this.allData.chrValues[newChr], function (cl) {
      freq[cl[8] + 1] += 1;
    });

    //let maxCluster = Math.max(...freq.slice(1))-1;
    let arr = freq.slice(1);
    let maxCluster = _.indexOf(arr, _.max(arr));
    let aTMP = _.indexOf(freq, _.max(freq));
    this.curGiantClusterID = maxCluster;
    let iii = 7;
    //////////
  }

  setChrData(newChr) {
    this.curChr = newChr;
    this.allGoodClusters = this.allData.chrClusters[newChr];
    this.data = this.allData["chrValues"][this.curChr];
    this.subData = this.data;
    this.setMaxGiantID(newChr);
    //this.maxC = Math.max(...this.data.map((o) => o[3])) + 1; ///??????????????????????????????
    let curMax=0;
    _.each(this.data, function(el){
      if (el[3]>curMax) {
        curMax=el[3];
      }
    });
    this.maxC = curMax+1;

  }

  showChrSelect() {
    console.log("Chromosome should be selected right now");
    this.addChrSelection(); //adds dropdown select for chromosomes
    //var newChr = "chr6";
    var newChr = this.allData.chrs[0];
    this.setChrData(newChr);
    console.log(newChr, " chosen");

    //this.changeChrTo("chr6"); //default to chr6, could change later
  }

  changeChrTo(newChr) {
    var self = this;
    this.setChrData(newChr);
    this.showFilteredClusters(this.checked);
    this.curClusters = this.allData.chrClusters[this.curChr];
    this.curColors = _.map(self.curClusters, function (c, i) {
      return self.cols[i % self.cols.length];
    });
    console.log(newChr, " chosen");
    //called every time chr is changed; changing data for ndx. Will have to save filters to keep them intact as well
    let yy = self.ndx;
    this.resetData(self.ndx, self.dimensions);
    this.ndx.add(this.subData);
    this.lenBarChart.xAxis().ticks(3);
    this.lenBarChart.render();
    dc.redrawAll();
  }

  afterShowChrSelect() {
    //console.log(this.data)
    //this.showTissues();
    addCheck(this.allData["tissues"]); //add checkboxes for tissues
    uncheckAllTicks();
    this.createNumberDivs(); //create DIVs for tissue clique statistics

    //get all possible tisBitMask values for current chromosome
    var possibleMasks = new Set();
    _.each(this.data, function (row) {
      possibleMasks.add(row[6]);
    });
    this.possibleMasks = Array.from(possibleMasks);
    ///

    this.startCrossfiltering();
  }

  //main function that creates most of the charts
  startCrossfiltering() {
    var usedData = this.subData; //current chromosome data

    dc.config.defaultColors(d3.schemeCategory10);
    var self = this;
    //this.subData contains a list of cliques that I want to show and crossfilter
    //every element is in format [ID, A, B, C, a, b, tisBitmap, tisCount, clusterID]
    this.dimensions = [];
    this.charts = [];
    //create some charts
    const myConsistencyChart = new dc.RowChart("#myConsistencyChartTag");
    this.myConsistencyChart = myConsistencyChart;
    this.charts.push(myConsistencyChart);

    // const myPieChart = new dc.PieChart('#myPieChartTag');
    // //const myCount = new dc.DataCount('#myTotalCliques')

    //CREATE CROSSFILTER
    var ndx = crossfilter(usedData);
    this.nxd = ndx;

    var cols = this.cols;
    // var plotColorMap = {};
    // for (let i=0; i<cols.length; i++){
    //     plotColorMap[i] = cols[i];
    // }

    //START CREATING DIFFERENT CHARTS

    // Start chart that says, e.g. "1,179 selected out of 6,242"
    var countChart = dc.dataCount("#mystats");
    this.countChart = countChart;
    this.charts.push(countChart);
    countChart.dimension(ndx).group(ndx.groupAll());

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //Start the cluster row chart. Used to choose some analytically found clusters
    const myClusterChart = new dc.PieChart("#myClusterChartTag");
    this.myClusterChart = myClusterChart;
    this.charts.push(myClusterChart);

    var clusterDimension = ndx.dimension(function (d) {
      return d[8];
    });
    this.clusterDimension = clusterDimension;
    this.dimensions.push(clusterDimension);
    var clusterGroup = clusterDimension.group().reduceCount();
    //var filtered_group = remove_bins(clusterGroup, [0,-1]) //removes cluster that has all points outside any cluster and removes the biggest cluster
    var filtered_group = clusterGroup;
    var curClusters = this.allData.chrClusters[this.curChr];
    this.curClusters = curClusters;
    //var curColors = this.curColors;
    var curColors = _.map(curClusters, function (c, i) {
      return cols[i % cols.length];
    });
    this.curColors = curColors;
    myClusterChart //CLUSTER ACTUALLY
      .width(256)
      .height(256)
      .slicesCap(20)
      .innerRadius(30)
      .dimension(clusterDimension)
      .group(filtered_group)
      //.legend(dc.legend().highlightSelected(true))
      // workaround for #703: not enough data is accessible through .label() to display percentages
      .on("pretransition", function (chart) {
        chart.selectAll("text.pie-slice").text(function (d) {
          return (
            d.data.key +
            " " +
            dc.utils.printSingleValue(
              ((d.endAngle - d.startAngle) / (2 * Math.PI)) * 100
            ) +
            "%"
          );
        });
      })
      .ordinalColors(self.curColors)
      // .colorAccessor(function (d) { return d; })
      // .colors(function(colorKey) { return plotColorMap[colorKey+1]; });
      .colors(d3.scaleOrdinal().domain(self.curClusters).range(self.curColors));

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var tissueDimension = ndx.dimension(function (t) {
      return t[6];
    });
    this.tissueDimension = tissueDimension;
    this.dimensions.push(tissueDimension);

    //Start consistency row chart. Used to choose some consistencies
    var consistencyDimension = ndx.dimension(function (d) {
      return d[7];
    });
    this.consistencyDimension = consistencyDimension;
    this.dimensions.push(consistencyDimension);
    var consistencyGroup = consistencyDimension.group().reduceCount();

    var ext = d3.extent(usedData, function (d) {
      return d[7];
    });
    ext[1] += 1;
    myConsistencyChart
      .width(256)
      .height(256)
      .x(d3.scaleLinear().domain([ext]))
      .elasticX(true)
      .dimension(consistencyDimension)
      .group(consistencyGroup)
      .ordering(function (d) {
        return d[7];
      })
      .colorAccessor(function (d) {
        return d.key % 10;
      })
      .ordinalColors(d3.schemeCategory10)
      .render();

    ///////////////////

    //////////////////////////////////////////////////////////////////////////////
    var consistencyBarChart = new dc.BarChart("#myConsistencyBarChartTag");
    this.charts.push(consistencyBarChart);
    this.consistencyBarChart = consistencyBarChart;

    var consistencyBarDimension = ndx.dimension(function (d) {
      return d[7];
    });
    this.consistencyBarDimension = consistencyBarDimension;
    this.dimensions.push(consistencyBarDimension);

    var consistencyBarGroup = consistencyBarDimension.group().reduceCount();

    var ext = d3.extent(usedData, function (d) {
      return d[7];
    });
    ext[1] += 1;
    consistencyBarChart
      .width(256)
      .height(256)
      .x(d3.scaleLinear().domain(ext))
      //.y(d3.scaleLog().domain([1,1000]))
      .brushOn(true)
      .yAxisLabel("consistency")
      .elasticY(true)
      .dimension(consistencyBarDimension)
      .group(consistencyBarGroup)
      .colorAccessor(function (d) {
        return d.key % 10;
      })
      .ordinalColors(d3.schemeCategory10);

    ///////////
    //new chart in cliqueLengthNewTag
    var lenBarChart = new dc.BarChart("#cliqueLengthNewTag");
    this.charts.push(lenBarChart);
    this.lenBarChart = lenBarChart;
    var lenBarDimension = ndx.dimension(function (d) {
      return d[3] - d[1];
    });
    this.lenBarDimension = lenBarDimension;
    this.dimensions.push(lenBarDimension);

    var lenBarGroup = lenBarDimension.group().reduceCount();

    var ext = d3.extent(usedData, function (d) {
      return d[3] - d[1];
    });
    ext[1] += 1;
    lenBarChart
      .width(256)
      .height(256)
      .x(d3.scaleLinear().domain(ext))
      //.y(d3.scaleLog().domain([1,1000]))
      .elasticX(true)
      .brushOn(true)
      .yAxisLabel("A-B length")
      .elasticY(true)
      .dimension(lenBarDimension)
      .group(lenBarGroup);

    lenBarChart.xAxis().ticks(3);

    ////////////////////////////////////////////////////////////////////////////

    // bitmap dimension and invisible bitmap chart that enables tissue checkboxes to work
    var myDummyChart = new dc.RowChart("#myDummyChartTag");
    this.myDummyChart = myDummyChart;
    this.charts.push(myDummyChart);

    var dummyDimension = ndx.dimension(function (d) {
      return d[6];
    });
    this.dummyDimension = dummyDimension;
    this.dimensions.push(dummyDimension);
    var dummyGroup = dummyDimension.group().reduceCount();

    var ext = d3.extent(usedData, function (d) {
      return d[6];
    });
    ext[1] += 1;
    myDummyChart
      .width(50)
      .height(50)
      .x(d3.scaleLinear().domain([ext]))
      .elasticX(true)
      .dimension(dummyDimension)
      .group(dummyGroup)
      .render();
    /////////////////
    // Cluster dummy chart
    var myDummyChart2 = new dc.RowChart("#myDummyChartTag2");
    this.myDummyChart2 = myDummyChart2;
    this.charts.push(myDummyChart2);

    var dummyDimension2 = ndx.dimension(function (d) {
      return d[8];
    });
    this.dummyDimension2 = dummyDimension2;
    this.dimensions.push(dummyDimension2);
    var dummyGroup2 = dummyDimension2.group().reduceCount();

    var ext = d3.extent(usedData, function (d) {
      return d[8];
    });
    ext[1] += 1;
    myDummyChart2
      .width(50)
      .height(50)
      .x(d3.scaleLinear().domain([ext]))
      .elasticX(true)
      .dimension(dummyDimension2)
      .group(dummyGroup2)
      .render();
    /////////////////

    //Start the big scatter chart of cliques size 3
    const nXBins = 300;
    const nYBins = 300;
    const binWidth = 20 / nXBins;

    var abDimension = ndx.dimension(function (d) {
      return [d[4], d[5], d[8]];
    });
    this.abDimension = abDimension;
    this.dimensions.push(abDimension);
    var abGroup = abDimension.group();

    //var plotColorMap = {0: '#ff7f0e', 1: '#8ca02c', 2: '#007f9e', 3: '#00a02c', 4: '#ff000e', 5: '#2c002c'};
    //plotColorMap = dc.schemeCategory10
    var myScatterPlot = new dc.ScatterPlot("#myScatterTag");
    this.myScatterPlot = myScatterPlot;
    this.charts.push(myScatterPlot);
    myScatterPlot
      .height(700)
      .width(700)
      .useCanvas(true)
      .x(d3.scaleLinear().domain([0, 2000000]))
      .y(d3.scaleLinear().domain([0, 2000000]))
      .yAxisLabel("b")
      .xAxisLabel("a length")
      .keyAccessor(function (d) {
        return d.key[0];
      })
      .valueAccessor(function (d) {
        return d.key[1];
      })
      .clipPadding(100)
      .dimension(abDimension)
      .highlightedSize(4)
      .symbolSize(3)
      .excludedSize(2)
      .excludedOpacity(0.5)
      .excludedColor("#ddd")
      .group(abGroup)
      .colorAccessor(function (d) {
        let ij = 2;
        return d.key[2];
      })
      .colors(function (colorKey) {
        let kn = 2;
        return self.curColors[colorKey + 1];
      });
    //.ordinalColors(d3.schemeSet1);

    //Start the bar charts. First with locations of the A segment, then with B and C
    var dx = 20000;
    var EXTT = [0, 10];
    var myCliqueLociPlotC = new dc.BarChart("#myCChart");
    this.myCliqueLociPlotC = myCliqueLociPlotC;
    this.charts.push(myCliqueLociPlotC);
    var CDimension = ndx.dimension(function (d) {
      return d[3];
    });
    this.CDimension = CDimension;
    this.dimensions.push(CDimension);
    var CGroup = CDimension.group(function (r) {
      return Math.floor(r / dx) * dx;
    });
    var ext = d3.extent(usedData, function (d) {
      return d[3];
    });
    ext[1] += 5;
    ext[0] = 0;
    EXTT[1] = ext[1];
    myCliqueLociPlotC
      .width(1000)
      .height(256)
      .x(d3.scaleLinear().domain(EXTT))
      .elasticX(true)
      .brushOn(true)
      .yAxisLabel("C")
      .elasticY(true)
      .dimension(CDimension)
      .group(CGroup);

    var myCliqueLociPlot = new dc.BarChart("#myAChart");
    this.charts.push(myCliqueLociPlot);
    this.myCliqueLociPlot = myCliqueLociPlot;

    var ADimension = ndx.dimension(function (d) {
      return d[1];
    });
    this.ADimension = ADimension;
    this.dimensions.push(ADimension);
    //var AGroup              = ADimension.group().reduceCount();
    var AGroup = ADimension.group(function (r) {
      return Math.floor(r / dx) * dx;
    });
    //var ext = d3.extent(usedData, function(d) { return (Math.floor(d[1]/dx)); }); ext[1]+=5; ext[0] =0;
    myCliqueLociPlot
      .width(1000)
      .height(256)
      .x(d3.scaleLinear().domain(EXTT))
      .elasticX(true)
      //.y(d3.scaleLog().domain([1,1000]))
      .brushOn(true)
      .yAxisLabel("A")
      .elasticY(true)
      .dimension(ADimension)
      .group(AGroup);

    var myCliqueLociPlotB = new dc.BarChart("#myBChart");
    this.myCliqueLociPlotB = myCliqueLociPlotB;
    this.charts.push(myCliqueLociPlotB);
    var BDimension = ndx.dimension(function (d) {
      return d[2];
    });
    this.BDimension = BDimension;
    this.dimensions.push(BDimension);
    var BGroup = BDimension.group(function (r) {
      return Math.floor(r / dx) * dx;
    });
    myCliqueLociPlotB
      .width(1000)
      .height(256)
      .x(d3.scaleLinear().domain(EXTT))
      .elasticX(true)
      .brushOn(true)
      .elasticY(true)
      .yAxisLabel("B")
      .dimension(BDimension)
      .group(BGroup);

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    //Start creating numbers that show how many cliques have n-th tissue, for every tissue
    var average = function (d) {
      return d.n;
    };

    var groupArray = _.map(self.allData.tissues, function (t) {
      let mask = self.allData.tisBits[t];
      return ndx.groupAll().reduce(
        function (p, v) {
          //p - result; v - karteja rindina, ko pieliek/nonem
          if ((v[6] & mask) == mask) {
            p.n++;
          }
          p.tot++;
          // ++p.n;
          // p.tot += v.Speed;
          return p;
        },
        function (p, v) {
          if ((v[6] & mask) == mask) {
            p.n--;
          }
          p.tot--;
          return p;
        },
        function () {
          return { n: 0, tot: 0 };
        }
      );
    });
    var numbersArray = _.map(self.allData.tissues, function (t) {
      return new dc.NumberDisplay("#nr" + t);
    });
    _.each(numbersArray, function (n) {
      self.charts.push(n);
    });

    _.each(groupArray, function (grp, i) {
      numbersArray[i].valueAccessor(average).group(grp);
      //macNumber2.valueAccessor(average).group(macGroup2);
    });

    ///////////// start the table
    var myBigTable = new dc.DataTable("#mySuperTable");
    this.charts.push(myBigTable);

    myBigTable
      .width(768)
      .height(480)
      .showSections(false)
      .dimension(abDimension)
      .columns([
        function (d) {
          return d[0];
        },
        function (d) {
          return d[1];
        },
        function (d) {
          return d[2];
        },
        function (d) {
          return d[3];
        },
        //function (d) { return d[7] },
        function (d) {
          let curMask = d[6];
          let tisBits = self.allData.tisBits;
          let ar = [];
          _.each(tisBits, function (mask, tis) {
            if ((curMask & mask) == mask) {
              ar.push(tis);
            }
          });

          return String(ar);
        },
      ])
      .sortBy(function (d) {
        return d[1];
      });

    ///////////

    dc.renderAll();
    this.ndx = ndx;
    console.log("done this");
  } //end the biggest, startCrossfiltering method, that created all charts and all dimensions

  showTissues() {
    //Sandra's version for creating tissue checkboxes. Not used
    var self = this;
    //var allTissues = ["AD2", "AO", "BL1", "CM", "EG2", "FT2", "GA", "GM", "H1", "HCmerge", "IMR90", "LG", "LI11", "LV", "ME", "MSC", "NPC", "OV2", "PA", "PO3", "RA3", "RV", "SB", "SG1", "SX", "TB", "TH1", "X5628FC"];
    var allTissues = this.allData["tissues"];
    // make checkboxes for tissue selection
    var html = '<form style="display:block">';
    _.each(allTissues, function (t) {
      html +=
        '<div><input type="checkbox" id="tissue' +
        t +
        '" value="' +
        t +
        '" class="tissues"> ';
      html += '<label for="tissue' + t + '">' + t + "</label></div>";
    });
    html += "</form>";
    $("#tissueSelect").append(html);
    $(".tissues").click(function () {
      console.log("click tick");
      console.log(self.selectedTissues());
      //container.onChangeTissue(this);
    });
  }

  selectedTissues() {
    //Sandra's version of creating checkboxes. Not used.
    return _.filter(this.allData["tissues"], function (t) {
      return $("#tissue" + t).is(":checked");
    });
  }

  addButton() {
    //Create a "Debug" button. Click it to call stopAndBreakpoint method, which can have a breakpoint to inspect variables
    var self = this;
    var html = '<button class="myButton">Debug</button>';
    $("#buttonPlaceholder").append(html);
    $(".myButton").click(function () {
      console.log("click tick");
      self.stopAndBreakpoint();
      //console.log(self.selectedTissues());
      //container.onChangeTissue(this);
    });
  }

  showFilteredClusters(checked) {
    //checked = 0, 1-pirmais(remove garbage? - true/false), , 2-otrais (izmest giant componenti? yes/no) vai 3-abi
    //if checked is "undefined", everything is still fine - because this is called every time chr is changed. If no changes to checkboxes happened, checked will stay undefined
    let giantClusterID = this.curGiantClusterID; //TODO
    let badClusters = new Set();
    if ((checked & 1) > 0) {
      badClusters.add(-1);
    }
    if ((checked & 2) > 0) {
      badClusters.add(giantClusterID);
    }

    let allCurClusters = this.allData.chrClusters[this.curChr];
    let allGoodClusters = _.filter(allCurClusters, function (cl) {
      return !badClusters.has(cl);
    });
    let iii = 8;
    this.myDummyChart2.replaceFilter([allGoodClusters]); // ! After tissues are changed, this applies tissue filter to all other charts

    dc.redrawAll();
    this.checked = checked;
  }

  showFiltered(checked) {
    //makes sure all charts stay up to date with selected tissues
    var self = this;
    console.log("called showFiltered");
    console.log(checked);
    var tisBits = this.allData.tisBits;
    var mask = 0;
    _.each(checked, function (f) {
      mask += tisBits[f];
    });
    console.log(mask);

    var goodMasks = []; //array with all masks that contain all selected tissues. E.g. if only tissue with bitmap 1 is selected, this will contain all odd masks 1,2,5,7,....16031, ...

    //for (let  i=0; i<=maxBitmap; i+=1){
    _.each(self.possibleMasks, function (i) {
      if ((i & mask) == mask) {
        goodMasks.push(i);
      }
    });

    this.myDummyChart.replaceFilter([goodMasks]); // ! After tissues are changed, this applies tissue filter to all other charts

    dc.redrawAll();
  }

  stopAndBreakpoint() {
    var data = this.abDimension.top(Infinity); //data to be saved in a file. Has all rows that are currently filtered
    var iii = 8; //put breakpoint here to debug the program on every click on "DEBUG" button
  }

  downloadCSV() {
    //downloads csv file with selected values
    var array = this.abDimension.top(Infinity);
    array.unshift(this.header); //add header

    var csv = Papa.unparse(array);

    var csvData = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var csvURL = null;
    if (navigator.msSaveBlob) {
      csvURL = navigator.msSaveBlob(csvData, "download.csv");
    } else {
      csvURL = window.URL.createObjectURL(csvData);
    }

    var tempLink = document.createElement("a");
    tempLink.href = csvURL;
    tempLink.setAttribute("download", "download.csv");
    tempLink.click();
  }

  //creates divs where count of cliques of every tissue will be written. E.g. "Mac1. We have 190 cliques."
  createNumberDivs() {
    var html = "";
    _.each(this.allData.tissues, function (t) {
      html +=
        '<div id="nr' +
        t +
        '" style="float: none">' +
        t +
        '. We have <span class="number-display"></span> cliques.</div>';
    });
    $("#tissueCounts").append(html);
  }

  getSelected() {
    return this.abDimension.top(Infinity);
  }
}

function remove_bins(source_group, bins) {
  // (source_group, bins...}
  //var bins = Array.prototype.slice.call(arguments, 1);
  return {
    all: function () {
      return source_group.all().filter(function (d) {
        return bins.indexOf(d.key) === -1;
      });
    },
  };
}
