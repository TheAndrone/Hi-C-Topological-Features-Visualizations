var netData = {}; 
var nodeColor = {
  default: {
            background: "cyan",
            border: "blue",
            highlight: { background: "red", border: "blue" },
            hover: { background: "white", border: "red" },
  },
  marked: {
            background: "crimson",
            border: "#713E7F",
            highlight: { background: "red", border: "black" },
            hover: { background: "white", border: "red" },
  },
}

class myContainer {
    constructor(playground) {
        this.type = "MyContainer";
        this.allData; //for all chrs
        this.data; //for current chromosome
        this.curChr; //currently selected chromosome
        this.playground = playground;
        this.markedSegments = new Set();
        this.d = {}; //dimensions
        this.extBarChart = {};
        this.barChart = {};
        this.barChartDimension = {};
        this.pieChart = {};
        this.ndx; //crossfilter object    
        this.resetCharts = ['#LociDiv', '#FantomDistanceDiv', '#GTExDistanceDiv'];   
    }   
  
    setData(data) {
        //reads data, the whole .json file, for all chromosomes
        var self=this;
        this.allData = data; //data for all chromosomes, the whole file
        console.log("allData is set", data);
        $("#readFileBigDiv").hide();
        let iii=9
        this.curChr = this.allData.chrNames[0];
        this.allChData = this.allData.chrValues[this.curChr]; //pointer to chrValues[ch]
        this.allData.tissueIDs = this.allData.tissueData.tissueIDs;
        //Add divs for segment (roadmap) states
        _.each(this.allData.states, function (t){
          let divId = "SandrasIezimjuDivSmall"+t;
          if (t=="ZNF/RPTS"){
            divId = "SandrasIezimjuDivSmallZNFRPTS"
          }
          $('<div class="extra-chart" id="'+divId+'"></div>').appendTo('#sandrasExtraChartsDiv');
        })

        //Add divs for segment (encode) states
        _.each(this.allData.possibleEncodes, function (t){
          let divId = "EncodeSmallFeatureDiv"+t;
          $('<div class="extra-chart" id="'+divId+'"></div>').appendTo('#encodeFeaturesDiv');
        })
        
        this.allData.stateToInd = {};
        _.each(this.allData.states, function(state, i){
          self.allData.stateToInd[state]=i;
        });
        console.log(this.allData);

        //Add headers for 14th, 15th, 16th, 17th, 18th, 19th columns
        this.allData["segmentEnsemblHeader"].push("RNA-pol.Encode")
        this.allData["segmentEnsemblHeader"].push("FANTOM5")
        this.allData["segmentEnsemblHeader"].push("FANTOM5 dist to closest")
        this.allData["segmentEnsemblHeader"].push("GTEx")
        this.allData["segmentEnsemblHeader"].push("GTEx dist to closest")
        this.allData["segmentEnsemblHeader"].push("Eigenvector centrality") //19th

        //this.showChrSelect(); //creates chr dropdown and selects one chr automatically
        this.afterShowChrSelect();
        //this.startMagic();
    }

    afterShowChrSelect() {
        addCheck(this.allData.tissueData.tissueIDs); //add checkboxes for tissues
        uncheckAllTicks();
    
        //get all possible tisBitMask values for current chromosome
        var possibleMasks = new Set();
        _.each(this.allData.triangles, function (c3) {
            possibleMasks.add(c3[3]);
        });
        this.possibleMasks = Array.from(possibleMasks);   
        console.log(this.possibleMasks, " are the possible bit masks of tissues")
        //this.startCrossfiltering();
    }

  initSegmentCrossfilter(){
    console.log("initSegmentCrossfilter");
    //Tissues are selected; this.activeSegments has all necessary rows for it
    var self = this;
    let header = this.allData.segmentEnsemblHeader;

    dc.config.defaultColors(d3.schemeCategory10);
    this.dimensions = [];
    this.charts = [];
    //CREATE CROSSFILTER
    var ndx = crossfilter(this.activeSegments);

    this.ndx = ndx;
    var cols = this.cols;

    function createBarChartSummable(self, divName, dimension, title , index, xaxisTitle, yaxisTitle, ext=null     ){
      $(divName).empty();    
      console.log("createBarChartSummable");
      var newBarChart = new dc.BarChart(divName);
      self.charts[divName] = newBarChart;
      if (ext==null){
        ext = d3.extent(self.activeSegments, function (d) {
            return d[index];
        });
        ext[1]+=1;
      }

      console.log('createBarChartSummable:: divName, ext', divName, ext);
      self.extBarChart[divName] = ext; 
      self.barChart[divName] = newBarChart;
      self.barChartDimension[divName] = dimension;  
      
      
      let group = dimension.group().reduceCount();


      newBarChart
        .x(d3.scaleLinear().domain(ext))
        .brushOn(true)
        .yAxisLabel(yaxisTitle)
        .xAxisLabel(xaxisTitle)
        .dimension(dimension)
        .group(group)
        .elasticY(true)
        .controlsUseVisibility(true)
        .height(203)
        .render();
    
      // Add a title to the chart within the same div
      let titleSize="h3";
      if ($(divName).find(".chart-title").length==0){
        d3.select(divName)
        .append(titleSize) // You can use an appropriate heading element
        .attr("class", "chart-title")
        .text(title);
      }

      // Create selected range and reset
      // <!-- Empty href JS to look like link but avoid navigation -->
      var html = '<div class="reset" style="visibility: hidden;">selected: <span class="filter"></span>' +           
           '<a href="javascript:" id="' + divName + '-reset" >reset</a></div>';    
      $(divName).append(html);

      // Add reset funtion to "reset" text
      document.getElementById(divName + "-reset").addEventListener('click', function(){ newBarChart.filterAll(); dc.redrawAll();});
                              
      return newBarChart;
    }




    function createPieChart(self, divName, dimension, labelList=[], title=""){
      console.log("createPieChart");
      var newPieChart = new dc.PieChart(divName);
      var vh=256;
      
      self.charts[divName] = newPieChart;
      self.dimensions.push(dimension);
      var newGroup = dimension.group().reduceCount();
      newPieChart 
        // .width(vh)
        // .height(vh)
        .slicesCap(20)
        .innerRadius(30)
        .dimension(dimension)
        .group(newGroup)
        .label(function (d) {
          let listWithOneZero = d.key;
          let ar = [];
          for (let i=0; i<d.key.length; i++){
            if (listWithOneZero[i]==1){
              ar.push(labelList[i])
            }
          }
          return d.value+"-["+ar.toString()+"]"; 
        })
        .title(function (d) {
          let listWithOneZero = d.key;
          let ar = [];
          for (let i=0; i<d.key.length; i++){
            if (listWithOneZero[i]==1){
              ar.push(labelList[i])
            }
          }
          return d.value+"-["+ar.toString()+"]"; 
        })
        .renderLabel(true)
        .colors(function (d) {
          return d[0] == 0 ? "#3C649A" : "orange";
        })
        

        let titleSize="h3";

        if (divName.includes("Small")){
          vh=100;
          newPieChart.width(vh).height(vh);
          titleSize="h5";

          newPieChart.ordering(function(d) {
            let iii=d.key;
            iii=0;
            if (d.key==[1]) {
                return -1;  // This will always place "SpecialKey" at the beginning
            } else {
                let iii=d.value;
                return -d.value;  // or any other default ordering for the rest
            }
        });
        }
        
        // Add a title to the chart within the same div
        if ($(divName).find(".chart-title").length==0){
          d3.select(divName)
          .append(titleSize) // You can use an appropriate heading element
          .attr("class", "chart-title")
          .text(title);
        }

        self.pieChart[divName] = newPieChart;




      return newPieChart;
    }
    var p1 = createPieChart(self, "#miRNADivSmall1", ndx.dimension(function (d) {return [d[3]];}), ["RNA"] , "miRNA Target Region"      );

    //var p4 = createPieChart(self, "#otherFTCDiv", ndx.dimension(function (d) {return [d[4], d[5]];}) , ["Enh", "TSS"] , "Other Regulatory Regions2"    );
    var p31 = createPieChart(self, "#otherFTCDivSmall1", ndx.dimension(function (d) {return [d[4]];}) , ["Enh"] , "Enh"     );
    var p32 = createPieChart(self, "#otherFTCDivSmall2", ndx.dimension(function (d) {return [d[5]];}) , ["TSS"] , "TSS"     );

    
    //var p5 = createPieChart(self, "#HumanRegFeatDiv", ndx.dimension(function (d) {return [d[6], d[7], d[8], d[9], d[10]];}) , ["Enh","Open chr.", "CTCF bind.s.","Prom.", "TF bind.", ] , "Regulatory Features"     );
    var p51 = createPieChart(self, "#HumanRegFeatDivSmall1", ndx.dimension(function (d) {return [d[6]];}) , ["Enh"] , "ENH"     );
    var p52 = createPieChart(self, "#HumanRegFeatDivSmall2", ndx.dimension(function (d) {return [d[7]];}) , ["Open chr."] , "Open chr"     );
    var p53 = createPieChart(self, "#HumanRegFeatDivSmall3", ndx.dimension(function (d) {return [d[8]];}) , ["CTCF bind.s."] , "CTCF b.s"     );
    var p54 = createPieChart(self, "#HumanRegFeatDivSmall4", ndx.dimension(function (d) {return [d[9]];}) , ["Prom."] , "Prom"     );
    var p55 = createPieChart(self, "#HumanRegFeatDivSmall5", ndx.dimension(function (d) {return [d[10]];}) , ["TF bind."] , "TF bind"     );
    
    
    
    var q6 = createBarChartSummable(self, "#SomaticDiv0", ndx.dimension(function (d) {return d[11];}), "Ensembl: Somatic Short Variant" , 11, "Property count", "Node count"     );
    var q7 = createBarChartSummable(self, "#SomaticDiv1", ndx.dimension(function (d) {return d[12];}), "Ensembl: Somatic Structural Variant" , 12, "Property count", "Node count"     );
    var q8 = createBarChartSummable(self, "#SomaticDiv2", ndx.dimension(function (d) {return d[13];}), "Ensembl: Structural Variant" , 13, "Property count", "Node count"     );

    var lociDim = ndx.dimension(function (d) {let dif=320000; return Math.floor(d[1]/dif)*dif;})
    var w1 = createBarChartSummable(self, "#LociDiv", lociDim, "Location on chromosome", 1, "Coordinates (bp)", "Node count")

    var w2 = createBarChartSummable(self, "#FantomDiv", ndx.dimension(function (d) {return d[15]}), "FANTOM5 expression", 15, "Expression (RLE-normalized)", "Node count", [1,self.fantomExtent+2])


    var ext = d3.extent(self.activeSegments, function (d) {
          return d[16];
      });
    ext[0]=0;
    var w3 = createBarChartSummable(self, "#FantomDistanceDiv", ndx.dimension(function (d) {let dif=1000; return Math.floor(d[16]/dif)*dif;}), "Distance to closest FANTOM5 locus", 16, "Distance in bp", "Node count", ext)

    var w4 = createBarChartSummable(self, "#GTExDiv", ndx.dimension(function (d) {return d[17]}), "GTEx expression", 17, "Max expression of overlapping/closest GTEx gene(s)", "Node count")
    var w5 = createBarChartSummable(self, "#GTExDistanceDiv", ndx.dimension(function (d) {let dif=1000; return Math.min(50000,Math.floor(d[18]/dif)*dif);}), "Distance to closest GTEx gene", 18, "Distance in bp", "Node count", [0,50001])
    
    var c1 = createBarChartSummable(self, "#ECentralityDiv", ndx.dimension(function (d) {return d[19]}), "Eigenvector centrality", 19, "Log10 of centrality", "Node count");
    

    let tissue = self.checkedTissues[0];
    let iii=9;
    _.each(self.allData.states, function(t){
      let divId = "#SandrasIezimjuDivSmall"+t;
      if (t=="ZNF/RPTS"){
        divId = "SandrasIezimjuDivSmallZNFRPTS"
      }
      let nd = ndx.dimension(function (d) {
        let returnable = [0];
        let allSegmentStateList = self.allChData.segmentStates;
        if (tissue in allSegmentStateList[d[0]]){
          if (allSegmentStateList[d[0]][tissue].includes(t)){
            returnable=[1];
          }
        }
        return returnable; //otherwise
        });
      var newp = createPieChart(self, divId, nd , [t] , t );  
    });
    //
    //create encode small charts
    _.each(self.allData.possibleEncodes, function(t){
      let divId = "#EncodeSmallFeatureDiv"+t;
      let nd = ndx.dimension(function (d) {
        let returnable = [0];
        let allSegmentStateList = self.allChData.encodeStates;
        if (tissue in allSegmentStateList[d[0]]){
          if (allSegmentStateList[d[0]][tissue].includes(t)){
            returnable=[1];
          }
        }
        return returnable; //otherwise
        });
      var newp = createPieChart(self, divId, nd , [t] , t );  
    }); 
    var b1 = createBarChartSummable(self, "#RNApolymeraseDiv", ndx.dimension(function (d) {return d[14];}), "RNA polymerase II binding sites (ENCODE)" , 14, "Property count", "Node count"     );



    // Start chart that says, e.g. "1,179 selected out of 6,242"
    var countChart = dc.dataCount("#mystats");
    this.countChart = countChart;
    this.charts["#mystats"] = countChart;
    countChart.dimension(ndx).group(ndx.groupAll());

    dc.renderAll();
    dc.chartRegistry.list().forEach(function(chart) {
      if (self.barChart[chart.anchor()]) {
        chart.on('filtered', function() {
          console.log("Trigggered from bar chart")
          self.onUpdateCall();
        });
      }
      if (self.pieChart[chart.anchor()]) {
        chart.on('filtered', function() {
          console.log("Trigggered from pie chart")
          self.onUpdateCall();
        });
      }

    });
    this.ndx = ndx;
    console.log("done this");

    this.addBarChartManualFiltering();

    this.addTooltips();

    this.uploadAllGraph();

  } 
   

    showFiltered() {
      console.log("showFiltered");
      //makes sure all charts stay up to date with selected tissues
      var self = this;
      var checked = self.checkedTissues;
      
      console.log("called showFiltered");
      console.log(checked);
      var tisBits = this.allData.tissueData.tissueBits;
      var mask = 0;
      _.each(checked, function (f) {
        mask += tisBits[f];
      });
      console.log("in show filtered..")
      console.log(mask);
      self.currentlyCheckedTissueBitmap = mask
    
      var goodMasks = []; //array with all masks that contain all selected tissues. E.g. if only tissue with bitmap 1 is selected, this will contain all odd masks 1,2,5,7,....16031, ...
    
      //for (let  i=0; i<=maxBitmap; i+=1){
      _.each(self.possibleMasks, function (i) {
        if ((i & mask) == mask) {
          goodMasks.push(i);
        }
      });
    
      // this.myDummyChart.replaceFilter([goodMasks]); // ! After tissues are changed, this applies tissue filter to all other charts
    
      // dc.redrawAll();
    }

    uploadSegments(){ //sets this.activeSegments
      console.log("uploadSegments");
      var self=this;
      console.log("Tissue mask selected for upload: ", this.currentlyCheckedTissueBitmap);
      var mask = this.currentlyCheckedTissueBitmap;
      //Atlasa segmentus - izskrien cauri visiem trissturiem; Atlasa tos segmentus, kas ir visamza vienaa triissturi
      // trissturi glabajas this.allData.triangles
      var goodTriangles = _.filter(self.allData.triangles, function(triangle, i){
        return (triangle[3] & mask)==mask
      });
      this.goodTriangles = goodTriangles;
      var goodSegments = new Set();
      _.each(goodTriangles, function(triangle, i){
        for (let j = 0; j < 3; j++) {
          goodSegments.add(triangle[j]);
        }
      });

      this.activeSegments = _.filter(this.allData.segmentEnsembl, function(row){
        return (goodSegments.has(row[0]));
      });

      let iii=9;
      //add 14th column with data on RNA-encode polymerase counts for the given segment
      let tissue = self.checkedTissues[0];

      _.each(this.activeSegments, function(row, i){
        let valDict=self.allChData.encodeRNAStates[row[0]];
        let val = (valDict[tissue]) ? valDict[tissue] : 0;
        self.activeSegments[i].push(val);
      })
      iii=0;

      //add 15th column with data on FANTOM5 for the given segment
      tissue = self.checkedTissues[0];
      self.fantomExtent=1000;
      var fanDic={};
      var valDic={};
      _.each(this.activeSegments, function(row, i){
        let valDict=self.allChData.segmentFantoms[row[0]];
        // let val = (valDict[tissue]) ? Math.ceil(valDict[tissue]) : 0;
        
        let val = (valDict[tissue]) ? ((valDict[tissue]<1) ? Math.ceil(valDict[tissue]*self.fantomExtent) : self.fantomExtent+1) : 0;
        
        if (!(valDict[tissue] in fanDic)){ fanDic[valDict[tissue]]=0;}
        fanDic[valDict[tissue]]+=1;

        if (!(val in valDic)){ valDic[val]=0;}
        valDic[val]+=1;

        self.activeSegments[i].push(val);

      })
      iii=0;

      //add 16th column with data on distance to closest fantom

      _.each(this.activeSegments, function(row, i){
        let valDict=self.allChData.closestFantoms[row[0]];
        let val=-5000;
        if (tissue in valDict){
          val=valDict[tissue];
        }
        // let val = (valDict[tissue]) ? valDict[tissue] : -5000;
        //let val = valDict[tissue];
        self.activeSegments[i].push(val);
      })
      iii=0;

      //add 17th column with data on expression value of the closest GTEx gene
      _.each(this.activeSegments, function(row, i){
        let valDict=self.allChData.segmentGTExGenes[row[0]];
        let val=-5000;
        if (tissue in valDict){
          val=valDict[tissue];
        }
        self.activeSegments[i].push(val);
      })


      //add 18th column with data on distance to closest GTEx gene
      _.each(this.activeSegments, function(row, i){
        let valDict=self.allChData.closestGTExGenes[row[0]];
        let val=-5000;
        if (tissue in valDict){
          val=valDict[tissue];
        }
        self.activeSegments[i].push(val);
      })

      iii+=1
      //add 19th column with data on segment Eigenvector centrality
      let vals = [];
      _.each(this.activeSegments, function(row, i){
        let valDict=self.allChData.ECentrality[row[0]];
        let val=-1;
        if (tissue in valDict){
          val=Math.log(valDict[tissue]);
        }
        self.activeSegments[i].push(val);
        vals.push(val);
      })



      console.log("Active segments calculated, ", this.activeSegments);
      

      this.initSegmentCrossfilter(); //Tissues are selected; this.activeSegments has all necessary rows for it

    }

    markSegments(){
      console.log("markSegments");
      let self=this;
      
      console.log("marking segments");
      var allFilteredRows = this.dimensions[0].top(Infinity);
      let filteredSegments = _.map(allFilteredRows, function(row){
        return row[0].toString();
      })
      let iii=9;
      this.markedSegments = new Set(filteredSegments);
      iii=1;
      

    }
    unmarkSegments(){
      console.log("unmarking segments");
      this.markedSegments = new Set();
    }

    uploadFilteredGraph(){
      console.log("uploadFilteredGraph");
      return this.uploadGraph(this.dimensions[0].top(Infinity));
    }
    uploadAllGraph(){
      console.log("uploadAllGraph");
      return this.uploadGraph(this.activeSegments);
    }

    uploadGraph(allFilteredRows){
      console.log("uploadGraph");
      var self = this;
      //var allFilteredRows = this.dimensions[0].top(Infinity); //data to be saved in a file. Has all rows that are currently filtered
      let iii=9;

      function removeDuplicates(arr) { 
        //console.log("removeDuplicates");
        return [...new Set(arr)]; 
      }

      function connComponets(adj){
        console.log("connComponets");
        var connComp = [];
        var checked = new Set();
        _.each(Array.from(nodeSetOfTriangles), function(v, i){
          if (!checked.has(v)) {
            var comp = [v];
            checked.add(v);
            var stack = [v];
            while (stack.length > 0) {
              var w = stack.pop();
              for (let u of adj[w]) {
                if (!checked.has(u)) { 
                  checked.add(u);
                  comp.push(u);
                  stack.push(u);
                }
              }
            }
            connComp.push(comp);
          }
        })
        return connComp;
      }
      
    


      function getNodeGenesAndProteins(nodeInd){
        // console.log("getNodeGenesAndProteins");
        let genes = self.allChData.segmentGenes[nodeInd];
        let proteins = [];
        let readableGenes = [];
        for (let gene of genes){
          let readableGeneName = self.allData.geneSymbolsProteins[gene].symbol;
          if (readableGeneName=="NA"){ readableGeneName=gene};
          readableGenes.push(readableGeneName);
          if (self.allData.geneSymbolsProteins[gene].protein!=''){
            proteins.push(self.allData.geneSymbolsProteins[gene].protein);
          }
        }
        readableGenes = removeDuplicates(readableGenes);
        proteins = removeDuplicates(proteins);
        return ({genes: readableGenes, proteins: proteins})
      }
      function getTitle(node, genesAndProteins){
        //console.log("getTitle");
        let s = /*'Name: '+node+'\n'+  */
                'Locus: '+nodeStrToLoci[node]+'\n'+
                'ID: '+ node+'\n';
        if (genesAndProteins.genes.length>0){
          s+='Genes: '+genesAndProteins.genes.toString()+'\n';
        }
        if (genesAndProteins.proteins.length>0){
          s+='Proteins: '+genesAndProteins.proteins.toString()+'\n';
        }
        let iii=0;
        let allFantomNames = self.allChData.fantomNames;
        let allFantomDists = self.allChData.closestFantoms;
        let allFantomExprs = self.allChData.segmentFantoms;
        let tissue = self.checkedTissues[0];
        let nodeID = parseInt(node);

        s+= 'Distance to closest fantom: '+allFantomDists[nodeID][tissue].toString() + '\n';
        s+= 'Closest fantom names: ' + allFantomNames[nodeID][tissue].toString() + '\n';
        s+= 'Closest Fantom5 highest expression: ' + allFantomExprs[nodeID][tissue].toString() + '\n\n';
        iii+=1;

        let allGTExNames = self.allChData.GTExGeneNames;
        let allGTExDists = self.allChData.closestGTExGenes;
        let allGTExExprs = self.allChData.segmentGTExGenes;
        iii+=1
        s+= 'Distance to closest GTEx gene: '+allGTExDists[nodeID][tissue].toString() + '\n';
        s+= 'Closest GTEx gene names: ' + allGTExNames[nodeID][tissue].toString() + '\n';
        s+= 'Closest GTEx highest expression: ' + allGTExExprs[nodeID][tissue].toString() + '\n';

        return s;
                
      }

      

      var nodeSet = new Set(_.map(allFilteredRows, function(row){return row[0]}));
      var nodeSetOfTriangles = new Set();
      var edgeTuples = new Set();
      var edges = [];
      //We want to add a link to a set. The link is represented as a pair of integers. In js this is impossible. We create a str object where # seperates the ints
      //This str is then added to set

      var adj = {};
      function getID(v){
        if (v[0] < v[1]) return [v[0].toString(), v[1].toString()];
        return [v[1].toString(), v[0].toString()];
      }
      

      for (let i=0; i<self.goodTriangles.length; i++){
        let T = self.goodTriangles[i]; //[100, 101, 102, 64];
        let iiii=1;
        if ( (nodeSet.has(T[0])) && (nodeSet.has(T[1])) && (nodeSet.has(T[2])) ){
          //if all 3 segments of the triangle are still filtered by pie charts
          //nodeSet.add(Tstr[0]);nodeSet.add(Tstr[1]);nodeSet.add(Tstr[2]);
          let Tstr =  _.map(T, function(s){return s.toString()}) //['100', '101', '102', '64']
          _.each([[Tstr[0], Tstr[1]], [Tstr[0],Tstr[2]],[Tstr[1],Tstr[2]]], function(fromToStr){
            nodeSetOfTriangles.add(fromToStr[0]);
            nodeSetOfTriangles.add(fromToStr[1]);
            let id = fromToStr[0]+"#"+fromToStr[1];
            if (!edgeTuples.has(id)){
              edgeTuples.add(id);
              edges.push({
                id: id,
                from: fromToStr[0],
                to: fromToStr[1],
              });
              for (let k=0; k<2; k++){
                if (!adj[fromToStr[k]]) 
                  adj[fromToStr[k]] = new Set();
                adj[fromToStr[k]].add(fromToStr[1 - k])
              }
            }
          });
        
        }
        
        // edgeTuples.add([T[0],T[1]]);
        // edgeTuples.add([T[1],T[2]]);
        // edgeTuples.add([T[0],T[2]]);
      };
      var connComp = connComponets(adj); 
      
      function nodePosOnCircle(allNodeLociList, O, R, nodeStrToLoci, a){
        //allNodeIndexList - list of indeces for all nodes
        ////Node index -> locuss via nodeStrToLoci dictionary
        //O - coordinates, relative (0,0) 
        //R - radius
        //a - angle for the cwentre of mass for the component
        let lociList = _.map(allNodeLociList, function(nodeStr){
          return nodeStrToLoci[nodeStr]
        });
        let minLocus = _.min(lociList);
        let maxLocus = _.max(lociList);
        let iii=0;
        let diff = maxLocus-minLocus;
        let lociAngles = _.map(lociList, function(locus){
          //return ((locus-minLocus)/diff)*(Math.PI/2)   +a -(Math.PI/4); //45deg outside
          //return ((locus-minLocus)/diff)*(Math.PI)   +a -Math.PI/2; //180deg outside
          return ((locus-minLocus)/diff)*(-Math.PI)   +a -Math.PI/2;
          //return ((locus-diff)/diff)*Math.PI + Math.PI/2 - Math.PI/2 +a;
        });
        let coordinates = _.map(lociAngles, function(angle){
          let x1 = O[0]+R*Math.sin(angle);
          let y1 = O[1]+R*Math.cos(angle);
          return [x1,y1];
        })
        iii=9;
        return coordinates;

        //returns a list with coordinates
      }

      var n = nodeSet.size;
      var nodePos = {};
      var nodeStrToLoci = {};
      _.each(self.activeSegments, function(row){
        nodeStrToLoci[row[0].toString()] = row[1];
      });
      var maxLocus = _.max(self.activeSegments, function(o){return o[1];})[1];
      let r=10000;

      //let test = nodePosOnCircle(_.map(self.activeSegments, function(o){return o[0];}), [0,0],100,nodeStrToLoci)

      _.each(connComp, function(c, i) {
        var sum =  _.reduce(c, function(memo, num){ 
          return memo+(nodeStrToLoci[num])},0);
          //return memo + (+num); }, 0);
        //normalization to 0..1
        var normalizedPos = (sum/(c.length))/maxLocus; //0..1
        var angle = normalizedPos*2*Math.PI + Math.PI/2; //0..PI
        var pos = [r*Math.sin(angle), r*Math.cos(angle)];
        // var a = Math.PI*(sum / c.length) / n; //0..1
        // var pos = [r* Math.cos(a), r* Math.sin(a)];
        let iiiii=9;
        //let coords = nodePosOnCircle(c, pos, Math.sqrt(c.length*r), nodeStrToLoci, angle);
        let strToInt = {};
        _.each(c, function(el){strToInt[el]=Number(el)})
        //let coords = nodePosOnCircle(c, pos, Math.sqrt(c.length*r), strToInt, angle); //using indeces, not real loci
        let smallR = Math.sqrt(c.length*r);
        let coords = nodePosOnCircle(c, pos, smallR, nodeStrToLoci, angle);
        //coords = _.map(coords, function(crd){ return [crd[0]+Math.random()*smallR*0.25,crd[1]+Math.random()*smallR*0.25 ]})
        
        _.each(c, function(v, j) {
          nodePos[v] = coords[j];
        })

      })
      let iiii=0;
      var nodes = _.map(Array.from(nodeSetOfTriangles), function(node, i){
        let genesAndProteins = getNodeGenesAndProteins(parseInt(node));
        let shape = "dot";
        if (genesAndProteins.genes.length>0){
          shape="square";
        }
        if (genesAndProteins.proteins.length>0){
          shape="hexagon";
        }
        let fantomInfo ={

        };
        let title = getTitle(node, genesAndProteins);
        return {id: node,
                shape: shape,  
                title: title, 
                // color: (self.markedSegments.has(node)) ? 'red' : 'green',  
                color: (self.markedSegments.has(node) ? nodeColor.marked : nodeColor.default),  
                x: nodePos[node][0]+Math.random()*200,
                y: nodePos[node][1]+Math.random()*200,    
        }
      });
        
        // edgeTuples.add([T[0],T[1]]);
        // edgeTuples.add([T[1],T[2]]);
        // edgeTuples.add([T[0],T[2]]);
      
      iii=9;

      self.drawGraph({nodes: nodes, edges: edges,});
    }

    drawGraph(graph) {
      console.log("drawGraph", graph);
      var self = this;
      var nodes = new vis.DataSet({});
      var objMap = {};
      var dragCTRL = {select: -1, onStartSelectedNodeIds: [], startPos: {}};

      _.each(graph.nodes, function (node) {
        var info = node;
        nodes.add(info);
        objMap[node.id] = node;
      });
      var edges = new vis.DataSet({});
      _.each(graph.edges, function (link) {
        var info = link;
        edges.add(info);
      });
      /* create a network */
      var container = document.getElementById("mygraph");
      var containerJQ = $("#mygraph");
      var data = {
        nodes: nodes,
        edges: edges,
      };
      var options = {
        nodes: {
          size: 32,
          borderWidth: 1.75,
          shape: "dot",
          scaling: {
            min: 10,
            max: 36,
          },
          font: { 
            multi: "html",
            size: 12,
            face: "Tahoma",
          },
          color: {
            background: "blue",
            border: "white",
            highlight: { background: "darkblue", border: "orange" },
            hover: { background: "mediumblue", border: "gold" },
          },
        },
        edges: {
          width: 6,
          color: {
            color: "rgba(30,144,255,1)",
            inherit: false,
          },
          smooth: false,
          scaling: {
            min: 1,
            max: 20,
          },
          font: {
            multi: "html",
            size: 16,
            face: "Tahoma",
          },
        },
        physics: {
          forceAtlas2Based: {
            gravitationalConstant: -640,
            centralGravity: 0.01,
            springLength: 230,
            springConstant: 0.18,
            avoidOverlap: 0.3,
          },
          maxVelocity: 146,
          solver: "forceAtlas2Based",
          timestep: 0.35,
          stabilization: { iterations: 150 },
        },
        interaction: {
          tooltipDelay: 200,
          hover: true,
          multiselect: true,
        },
      };
      //options.physics=false;
      // var network = new vis.Network(container, data, options);
      
      //No JSFidlle (https://jsfiddle.net/kbj54bas/)
      var network;

      var canvas;
      var ctx;
      var rect = {}, drag = false;
      var drawingSurfaceImageData;

      function saveDrawingSurface() {
        console.log("saveDrawingSurface");
        drawingSurfaceImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }

      function restoreDrawingSurface() {
        console.log("restoreDrawingSurface");
        ctx.putImageData(drawingSurfaceImageData, 0, 0);
      }

      function selectNodesFromHighlight() {
        console.log("selectNodesFromHighlight");
        var nodesIdInDrawing = [];
        var xRange = getStartToEnd(rect.startX, rect.w);
        var yRange = getStartToEnd(rect.startY, rect.h);

        var allNodes = nodes.get();
        for (var i = 0; i < allNodes.length; i++) {
          var curNode = allNodes[i];
          var nodePosition = network.getPositions([curNode.id]);
          var nodeXY = network.canvasToDOM({x: nodePosition[curNode.id].x, y: nodePosition[curNode.id].y});
          if (xRange.start <= nodeXY.x && nodeXY.x <= xRange.end && yRange.start <= nodeXY.y && nodeXY.y <= yRange.end) {
            nodesIdInDrawing.push(curNode.id);
          }
        }
        network.selectNodes(nodesIdInDrawing);
        self.filterByIds(); //!!! this call ensures that a filter is applied to the currently selected (active) nodes  
                            //uses netData.network.getSelectedNodes(); to access the active nodes
      }

      function getStartToEnd(start, theLen) {
        return theLen > 0 ? {start: start, end: start + theLen} : {start: start + theLen, end: start};
      }
        document.body.oncontextmenu = function() {return false;};
        network = new vis.Network(containerJQ[0], data, options);
        canvas = network.canvas.frame.canvas;
        ctx = canvas.getContext('2d');


        // Andreja 
        function pointInRect(point, rect) {
          return rect[0] < point.x && point.x < rect[2] && rect[1] < point.y && point.y < rect[3];
        }
        network.on("dragEnd", function (params) {
          if (dragCTRL.select == -1) {
            return;
          } 
          console.log("Drag end, selected nodes:", network.getSelectedNodes(), "params:", params, dragCTRL);
          if (dragCTRL.select == 0) {
            nodes.update(_.map(params.nodes, function(nodeId) { return {id: nodeId, fixed: { x: true, y: true }}}));
          }
          else{
            if (dragCTRL.select == 3) {
              var startPos = dragCTRL.startPos;
              var endPos = params.pointer.canvas;
              var selRect = [Math.min(startPos.x, endPos.x), 
                Math.min(startPos.y, endPos.y),
                Math.max(startPos.x, endPos.x), 
                Math.max(startPos.y, endPos.y)];
              var nodePos = network.getPositions(dragCTRL.onStartSelectedNodeIds);
              var nodeIdsOutRect = _.filter(_.keys(nodePos), function(id) { 
                return !pointInRect(nodePos[id], selRect); 
              });
              network.selectNodes(nodeIdsOutRect);

              console.log("Drag end with CTRL, selected nodes:", dragCTRL);
              console.log("\tselRect, nodeIdsOutRect", selRect, nodeIdsOutRect);
            }
            else if (dragCTRL.select == 2) {
              console.log("### network.on('dragEnd'):: dragCTRL.select never be 2", dragCTRL);
            }
            console.log("Drag end final, selected nodes:", network.getSelectedNodes());
            self.filterByIds();
          }
          dragCTRL = {select: -1, onStartSelectedNodeIds: [], startPos: {}};
        });
        network.on("dragStart", function (params) {
          if (params.event.srcEvent.shiftKey || params.nodes.length > 0) {
            console.log("Drag start, selected nodes:", network.getSelectedNodes(), "params:", params, dragCTRL);
            if (dragCTRL.select > 0) {
              console.log("### network.on('dragStart'):: is not 0", dragCTRL.select);
            }
            dragCTRL.select = (params.event.srcEvent.shiftKey) ? 1 : 0;
            dragCTRL.select += (params.event.srcEvent.ctrlKey) ? 2 : 0;

            if (dragCTRL.select == 0) {
              nodes.update(_.map(params.nodes, function(nodeId) { return {id: nodeId, fixed: { x: false, y: false }}}));
            }
            else {
              dragCTRL.onStartSelectedNodeIds = network.getSelectedNodes();
              dragCTRL.startPos = params.pointer.canvas;
            }
          }
        });

        // freeze all nodes
        network.on("stabilizationIterationsDone", function (params) {
          console.log("stabilizationIterationsDone");
          var nodeIDs = nodes.getIds();
          var updateInfo = _.map(nodeIDs, function(nodeID) { return { id: nodeID, fixed: { x: true, y: true } }; })
          nodes.update(updateInfo);
          // _.each(nodeIDs, function (nodeID) {
          //   nodes.update({ id: nodeID, fixed: { x: true, y: true } }); //this was slow
          // })
        });
        
        netData.network = network;
        netData.data = data;
        netData.graph = graph;
        netData.freeze = false;
        netData.objMap = objMap;

        self.addNetworkCrossfilter(); //add crossfilter functionality to the network graph. Can only happen once it is drawn
        self.onUpdateCall(); //to fix color from initial green to red - initially all nodes are selected, hence are red. Workaround for initial color set to green
      // });
    }
    

    onUpdateCall(){
      console.log("onUpdateCall");
      console.log("charts updated");
      let filteredRows = this.dimensions[0].top(Infinity); //collect the rows that satisfy absolutely all filters
      let allExistingRows = this.activeSegments.length;
      let somethingIsChosen=true;
      // if (allExistingRows==filteredRows.length){
      //   filteredRows = [];
      //   somethingIsChosen=false;
      // } //removed to ensure that when all s selected, nodes are red and not green
      let filteredNodes = _.map(filteredRows, function(row){
        return row[0].toString();
      });


      $('#downloadCSVBTN').attr("disabled", false);

      
      //let allGreen = (allExistingRows==filteredRows.length);
      let filteredNodesSet = new Set(filteredNodes);
      
      

      let allNodeRows = this.activeSegments;
      let allNodes = _.map(allNodeRows, function(row){
        let id = row[0].toString();
        return {
          id:id, 
          color:(filteredNodesSet.has(id)? 'red': 'green'),
          size:(filteredNodesSet.has(id)? 48: 32),
        }
      })

      netData.data.nodes.update(allNodes);
      

    }

  getNodeInfoFromTitle(nodeId) {
    var node = netData.data.nodes.get(String(nodeId));
    let str =  node ? node.title : null; // Returns the title if the node exists, otherwise null
    if (str==null){
      return null;
    }
    function parseTitleString(dataString) {
      const lines = dataString.split('\n').filter(line => line.trim() !== ''); // Remove empty lines
      const dataObject = {};
      
      lines.forEach(line => {
        const [key, value] = line.split(':').map(part => part.trim());
        dataObject[key] = value;
      });
    
      return dataObject;
    }
    let a = parseTitleString(str);
    return parseTitleString(str);
  
  }
  
  // // Example usage
  // var nodeTitle = getNodeTitleById(1); // Replace 1 with the ID of the node you're interested in
  // console.log(nodeTitle); // Logs "Title of Node 1"
  
    downloadCSV() {
      //downloads csv file with selected values
      var self=this;
      var array = this.dimensions[0].top(Infinity);
      array.unshift(self.allData.segmentEnsemblHeader); //add header

      function processArray() {
        let dataArray = array;
        const updatedArray = [dataArray[0]]; // Initialize with the header row
      
        let newHeaders = [];
      
        dataArray.slice(1).forEach(row => {
          const id = row[0]; // ID is always the first element
          const additionalData = self.getNodeInfoFromTitle(id);
      
          // Update the newHeaders array if it's the first row being processed
          if (newHeaders.length === 0) {
            newHeaders = Object.keys(additionalData);
            updatedArray[0] = updatedArray[0].concat(newHeaders); // Append new headers to the header row
          }
      
          // Append new data values to the current row
          const updatedRow = row.concat(newHeaders.map(header => additionalData[header] || ""));
          updatedArray.push(updatedRow);
        });
      
        return updatedArray;
      }
      function filterColumnsByHeader(processedArray, headersToKeep) {
        // Find indices of the headers to keep
        const headerIndices = processedArray[0].map((header, index) => 
          headersToKeep.includes(header) ? index : -1
        ).filter(index => index !== -1);
        
        // Create a new array with filtered columns based on identified indices
        const filteredArray = processedArray.map(row => 
          headerIndices.map(index => row[index])
        );
      
        return filteredArray;
      }

      array = processArray();

      let columnsToKeep = [
        "ID", "A", "B", "miRNA targ:RNA", "Regul. reg:Enhancer",
        "Regul. reg:Transcription Start Site", "Reg. Feat:Enhancer", "Reg. Feat:TF binding",
        "Reg. Feat:Open chromatin", "Reg. Feat:CTCF Binding Site", "Reg. Feat:Promoter",
        "Som. sh. v:count", "Som. str. v:count", "Str. v:count", "RNA-pol.Encode",
        "Genes", "Proteins",
        "Distance to closest fantom", "Closest fantom names", "Closest Fantom5 highest expression",
        "Distance to closest GTEx gene", "Closest GTEx gene names", "Closest GTEx highest expression"
      ];
      array = filterColumnsByHeader(array, columnsToKeep);
      


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
  
  addBarChartManualFiltering(){
    var self=this;
    // Function to update input fields
    // Updated function to update input fields with rounded and formatted values
    function updateInputFields(chartName, lower, upper) {
      // Round the values to the closest integer
      var roundedLower = Math.round(lower);
      var roundedUpper = Math.round(upper);
      if (Number.isNaN(roundedLower)){
        roundedLower = 0;
      }
      if (Number.isNaN(roundedUpper)){
        roundedUpper = 10e8;
      }

      // Format the rounded values with thousand separators
      var formattedLower = roundedLower;
      var formattedUpper = roundedUpper;

      $(chartName + '_lower-bound').val(formattedLower);
      $(chartName + '_upper-bound').val(formattedUpper);
    }

    // Function to reset input fields to the full data range
    function resetInputFields() {
      _.each(self.resetCharts, function(cname) { 
        var ext = self.extBarChart[cname];
        updateInputFields(cname, ext[0], ext[1]); // Use your data's min and max values
      })
    }
    // Add filter handler to update input fields when the chart's filter changes
    _.each(self.resetCharts, function(cname) { 
      self.barChart[cname].on('filtered', function(chart, filter) {
        console.log("barChart.on filtered event", chart['_anchor'], self.extBarChart[chart['_anchor']], chart['_anchor']);
        if (filter) {
            // Update input fields with the current filter range
            // var ext = self.extBarChart[chart['_anchor']];
            updateInputFields(chart['_anchor'], filter[0], filter[1]);
            // self.theBarChartDimension.filterFunction(function (d) {
            self.barChartDimension[chart['_anchor']].filterFunction(function (d) {
              return d >= filter[0] && d <= filter[1]; //apply filter directly on the dimension
          });
        } else {
          // Reset input fields if the filter is cleared
          var ext = self.extBarChart[chart['_anchor']];
          updateInputFields(chart['_anchor'], ext[0], ext[1]); // Use your data's min and max values
          // resetInputFields();
        }
        self.onUpdateCall();
        dc.redrawAll();
      });
    });
    // Apply manual filter from input fields to the chart
    function applyManualFilter() {
      console.log("applyManualFilter");
      var resetCharts = ['#LociDiv', '#FantomDistanceDiv', '#GTExDistanceDiv'];
      _.each(self.resetCharts, function(chartName) { 
        var lowerBound = +($(chartName + '_lower-bound').val());
        var upperBound = +($(chartName + '_upper-bound').val());

        // Clear any existing filters before applying a new one
        self.barChart[chartName].filter(null);
        // Apply the new filter to the chart
        self.barChart[chartName].filter([lowerBound, upperBound]);

        // self.theBarChart.filter(null);
        // // Apply the new filter to the chart
        // self.theBarChart.filter([lowerBound, upperBound]);
      })
      self.onUpdateCall();
      dc.redrawAll();
    }
    document.getElementById('apply-filter').addEventListener('click', function() {
      applyManualFilter();
    });
    // Call this initially to set the input fields to the full range
    resetInputFields();
  }

  addTooltips(){
    //this method is called after all charts are drawn
    //It adds a tooltip for some pie charts
    console.log("addTooltips");

    var $tooltip = $('<div class="mytooltip"></div>').appendTo('body'); // Create a single tooltip

    function addTooltipFunctionalityForGroup(groupSelector, tooltipValues){
      $(groupSelector).hover(function() {
        let titleText = $(this).text();
        var tooltipContent = titleText;
        if (titleText in tooltipValues){
          tooltipContent = tooltipValues[titleText];
        };//else - display the text of the title
        $tooltip.text(tooltipContent).show();
      }, function() {
        $tooltip.hide();
      }).mousemove(function(e) {
        $tooltip.css({
            top: e.pageY + 10 + 'px',
            left: e.pageX + 10 + 'px'
        });
      });
    }
    var encodeDict = {
      "Low-DNase": "Low-DNase",
      "DNase-H3K4me3": "DNase-H3K4me3",
      "dELS": "dELS",
      "PLS": "PLS",
      "Unclassified test": "Unclassified--",
      "High-H3K27ac": "High-H3K27ac",
      "pELS": "pELS",
      "DNase-only": "DNase-only",
      "CTCF-only": "CTCF-only",
      "High-H3K4me3": "High-H3K4me3",
      "CTCF-bound": "CTCF-bound",
    }

    addTooltipFunctionalityForGroup('#encodeFeaturesDiv h5', encodeDict);

    var ensDict = {"Enh": "Enhancer from Human other regulatory features",
              "TSS": "transcription start site",
              "ENH": "Enhancer from Human regulatory features",
              "Open chr": "open chromatin",
              "CTCF b.s": "CTCF binding site",
              "Prom": "promoter",
              "TF bind": "TF binding site",
            };

    addTooltipFunctionalityForGroup('#ens1wr h5', ensDict);

    addTooltipFunctionalityForGroup('#ens2wr h5', ensDict);

    addTooltipFunctionalityForGroup('#ens3wr h5', ensDict);

    addTooltipFunctionalityForGroup('#pieChartsDiv h5', {"ENH": "enhancer",
                                                        "ENH_BIV": "bivalent enhancer",
                                                        "HET": "heterochromatin",
                                                        "PC": "Polycomb-mediated repression",
                                                        "QUI": "quiescent",
                                                        "TSS": "transcription start site",
                                                        "TSS_BIV": "transcription start site (bivalent)",
                                                        "TX": "active transcription",
                                                      });
    //





    
    


  }

  addNetworkCrossfilter(){
    console.log("addNetworkCrossfilter");
    var self = this;
    self.idDimension = self.ndx.dimension(function(d) { return d[0]; }); // d[0] is the ID  
  }
  filterByIds() {
    var self=this;
    console.log("filterByIds")
    function resetIdFilter() {
      self.idDimension.filterAll(); // Removes any filters on the idDimension
      dc.redrawAll(); // Redraw all charts to reflect the change
    }
    resetIdFilter(); //?IDK if this is necessary. This first removes the old filter on the IDs, and only then applies the new IDs
    var currentIDs = netData.network.getSelectedNodes(); //access to the currently active nodes
    currentIDs = currentIDs.map(str => parseInt(str, 10));

    self.idDimension.filter(function(d) {
        return currentIDs.includes(d); // Keep only IDs that are in currentIDs which is a list with IDs I want to keep
    });
    self.onUpdateCall();
    dc.redrawAll(); // Redraw all charts to reflect the filtered data
  }   

  resetAll(){
    dc.filterAll();
    this.idDimension.filterAll();
    this.onUpdateCall();
    uncheckAllTicks();
    dc.renderAll();

  }

} //end myContainer class


function addCheck(tissues) {
    var cases = tissues; //= this.allData["tissues"]
    var html = "";
    //html+= '<div id="nr'+t+'" style="float: none">'+t+'. We have <span class="number-display"></span> cliques.</div>'
  
    _.each(cases.sort(), function (t) {
      html +=
        // '<input type="checkbox" name="checkGroup" class="myTissueTick" id="' +
        '<input type="radio" name="checkGroup" class="myTissueTick" id="' +
        t +
        '" value="' +
        t +
        '"  onclick="filter();" checked="checked"> ' +
        t;
    });
    $("#tissueSelect").append(html);


}
function uncheckAllTicks() {
    let iii = 9;
    $(".myTissueTick").each(function () {
      $(this).prop("checked", false);
    });
}
function filter() {
  //called on change event of every checkbox

  checked = getCheckedByName("checkGroup");
  console.log(checked);
  container.checkedTissues = checked;
  container.showFiltered();
  
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
