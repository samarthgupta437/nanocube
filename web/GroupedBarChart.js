function GroupedBarChart(id){
    var content = $(id).css('content');
    var margin = {top:10,right:10,left:50,bottom:30};

    if (!(content == "none" || content == "")){ //fix for firefox
        content = content.substr(1,content.length-2); //remove ''
        content = content.replace(/\\/g, ''); //fix for firefox slashes
        content = $.parseJSON(content);

        if (content.margin != undefined){
            margin.top = content.margin.top || margin.top;
            margin.left = content.margin.left || margin.left;
            margin.right = content.margin.right || margin.right;
            margin.bottom = content.margin.bottom || margin.bottom;
        }
    }
    
    this.data = {};
    this.selection=null;

    this.id = id;

    var width = $(id).width() - margin.left - margin.right;
    var height = $(id).height()- margin.top - margin.bottom;
    
    //add svg to the div
    this.svg = d3.select(id).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform","translate(" + margin.left + "," 
                          + margin.top + ")");
    
    //axis
    this.x  = d3.scale.linear().range([0,width]);
    this.y0  = d3.scale.ordinal().rangeRoundBands([0,height],0.05);//cat
    this.y1  = d3.scale.ordinal();//selections

    this.xAxis = d3.svg.axis()
        .scale(this.x)
        .orient("bottom")
        .ticks(4)
        .tickFormat(d3.format('.2s'));
    
    this.yAxis = d3.svg.axis()
        .scale(this.y0)
        .orient("left");
    
    //add axis to the svg
    this.svgxaxis = this.svg.append("g")
                            .attr("class", "axis x")
                            .attr("transform", "translate(0," 
                                  + (height+3) + ")");
    
    this.svgyaxis = this.svg.append("g")
                            .attr("class", "axis y")
                            .attr("transform", "translate(-3,0)");
}

GroupedBarChart.prototype.updateAxis = function(data){
    this.x.domain([0, d3.max(data, function(d){return d.value;})]);
    var cats = data.map(function(d){return d.cat;});
    this.y0.domain(cats);
    this.y1.domain(data.map(function(d){return d.color;}))
        .rangeRoundBands([0, this.y0.rangeBand()]);
           

    this.svgxaxis.call(this.xAxis);
    this.svgyaxis.call(this.yAxis);


};

GroupedBarChart.prototype.setData = function(data,id,color){
    this.data[id] = {color:color, data: data};
};

GroupedBarChart.prototype.setSelection = function(sel){
    this.selection = sel;
};

GroupedBarChart.prototype.removeData = function(id){
    if (id in this.data){ delete this.data[id]; }
};

GroupedBarChart.prototype.flattenData = function(data){
    return Object.keys(data).reduce(function(prev,curr){ 
        var row = Object.keys(data[curr].data).map(function(k){
            return { addr: data[curr].data[k].addr, 
                     cat: data[curr].data[k].cat,
                     color: data[curr].color,
                     value:data[curr].data[k].value };
        });
        return prev.concat(row);
    }, []);
};


GroupedBarChart.prototype.setClickCallback = function(cb){
    this.click_callback = cb;
};

GroupedBarChart.prototype.redraw = function(){
    var flatdata = this.flattenData(this.data);
    this.updateAxis(flatdata);
    var that = this;

    //remove the bars
    this.svg.selectAll('.bar')
        .data([])
        .exit()
        .remove();

    //add the bars back
    this.svg.selectAll('.bar')
        .data(flatdata).enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', function(d){return that.y0(d.cat) //category
                               +that.y1(d.color);}) //selection group
        .attr('height',function(d){return that.y1.rangeBand();})
        .attr('width',function(d){return that.x(d.value);})
        .on('click', this.click_callback) //toggle callback
        .style('fill', function(d){
            if (that.selection.length < 1  //no selection (everything)
                || (that.selection.indexOf(d.addr) != -1 )){ //addr in selection
                    return d.color;
                }
            else{
                return 'gray';
            }
        })
        .append("svg:title") //tooltip
        .text(function(d) { return d.value; });   
};