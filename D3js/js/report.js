$.getJSON("./jsonFiles/allconfig.json", function (data) {
	allconfig = data
	chartlabel = allconfig['chartlabel']
	unitlabel = allconfig['unitlabel']
	});
$.getJSON("./jsonFiles/axisrange.json", function (data) {
	axisrange = data
});

window.onload = function(){
	// レイアウトの設定
	WIDTH = 3200,HEIGHT = 2200;
	margin = {top: 20, bottom: 0, left: 60, right: 100, space: 100, sh: 150, chart:80};
	width = 400,cwidth = 120;
	height = width * 2.2;
	Pwidth = width;
	Ewidth = width * 0.85;
	Eheight = Ewidth;

	// tooltip内の認識するタグを追加
	myDefaultWhiteList = $.fn.tooltip.Constructor.Default.whiteList
	myDefaultWhiteList.table = []
	myDefaultWhiteList.col = []
	myDefaultWhiteList.td = []
	myDefaultWhiteList.tr = []
	myDefaultWhiteList.th = ['colspan']
	myDefaultWhiteList.tbody = []
	myDefaultWhiteList['*'].push('style')
	myDefaultWhiteList['*'].push('width')
	myDefaultWhiteList['table'].push('border')
	myDefaultWhiteList['table'].push('bgcolor')
	console.log(myDefaultWhiteList)

	// Initialize
	ss,drop,flow,variable,input = document.forms.action,
	NODE = {},Assoc = {},controllist = {};
	
	END_AP = {'ss4':5,'ss5':92,'ss6':11}, END_NODE = {'ss4':20,'ss5':452,'ss6':731}, STAPERBSS = {'ss4':5,'ss5':4,'ss6':80};		
	Crange = ['#000080', '#0000ff', '#0080ff', '#00ffff', '#00ff80', '#ffcc00', '#ff8000', '#ff0000'];
	cr = {'ss4': 0.25,'ss5': 0.25,'ss6': 0.25}, CR = {'ss4': 0.5,'ss5': 1.0,'ss6': 1.0};
}

function construct(){
	ss = input.ss.value;
	drop = input.drop.value;
	flow = input.flow.value;
	variable = input.variable.value;
	
	svg = d3.select("#insert_svg").append("svg")
		.attr("id", "chart")
		.attr("width",WIDTH)
		.attr("height",HEIGHT);
		
	//show detect line
	presource = 0
	predestination = 0
	rolelist = ['AP']
	online = false;
	controllist = Object.keys(dataset);
	
	NODE = dataset[controllist[0]][ss][drop]
	for(var node in NODE){
		Assoc[node] = []
		if(node >= END_AP[ss]){
			Assoc[NODE[node]['bss']].push(node);
			Assoc[node].push(NODE[node]['bss']);
		}
	}
	for(var i = 0 ; i < ElementsCount ; i++ ) {
		if (input.role[i].checked ==true){
			rolelist.push(input.role[i].value);
		}
	}

}
// Plot
function Plot(ss, drop, flow, variable){
	rightoffset = [0,width + margin.space]
	// Chart
	Plotchart = svg.append("g")
		.attr("id", "Plotchart")
		.attr("transform", translate(margin.left,margin.top));
	Cbarchart = Plotchart.append("g")
		.attr("id", "Cbarchart")
		.attr("transform", translate(0,0));
	Leftchart = Plotchart.append("g")
		.attr("id", "Leftchart")
		.attr("transform", translate(cwidth,0));
		
	if (ss == 'ss6'){
		Rightchart = Plotchart.append("g")
			.attr("id", "Rightchart")
			.attr("transform", translate(cwidth,height / 3.3 + margin.space));
	}else{
		Rightchart = Plotchart.append("g")
			.attr("id", "Rightchart")
			.attr("transform", translate(cwidth + width + margin.space,0));
		
	}

	chartlist = [Leftchart, Rightchart]
	controlcolor = {}
	controlcolor[controllist[0]] = 'red'
	controlcolor[controllist[1]] = 'blue'
	
	act = flow + 'act'
	flowval = (variable == 'thr' || variable == 'mcs' || variable == 'sinr') ? flow + variable : variable;
	
	var Cdomain = []
	// Color	
	for(var i = 0,len = Crange.length; i < len ; i++){
		if (variable == 'thr' || variable == 'mcs' || variable == 'sinr'){
			Cdomain.push(axisrange[ss]['AP']['Min'][flowval] + ((axisrange[ss]['AP']['Max'][flowval] - axisrange[ss]['AP']['Min'][flowval] ) * i/ (Crange.length - 1)))
		}else{
			Cdomain.push(axisrange[ss]['STA']['Min'][flowval] + ((axisrange[ss]['STA']['Max'][flowval] - axisrange[ss]['STA']['Min'][flowval] ) * i/ (Crange.length - 1)))
		}
	}
	
	color = d3.scaleLinear().domain(Cdomain).range(Crange);
	cbar = Cbarchart.selectAll(".cbar")
		.data(Cdomain.reverse())
		.enter().append("g")
		.attr("class", "cbar")
		.attr("transform", function(d, i) { return translate(0,100+i*25); })
		.style("font-size", "20px");
	cbar.append("rect")
		.attr("x", 0)
		.attr("width", 20)
		.attr("height", 20)
		.attr("fill", color);
	cbar.append("text")
		.attr("x", 30)
		.attr("y", 15)
		.attr("text-anchor", "start")
		.text(function(d) { return Math.floor(d*Math.pow(10,1))/Math.pow(10,1); });	
	// Chart Title
	Cbarchart.append("text")
		.attr("transform", translate(0, margin.top))
		.attr("text-anchor", "middle")
		.style("font-size", "20px")
		.text('Color Scheme');
	Cbarchart.append("text")
		.attr("transform", translate(0, margin.top+25))
		.attr("text-anchor", "middle")
		.style("font-size", "20px")
		.text(chartlabel[flowval]);
	Cbarchart.append("text")
		.attr("transform", translate(0, margin.top+50))
		.attr("text-anchor", "middle")
		.style("font-size", "24px")
		.text('['+unitlabel[flowval]+']');
	
	if(ss == 'ss5')	Scenario5();
}
//ss5	
function Scenario5(){
	// Scaling
	x = d3.scaleLinear().domain([0, 50]).range([0, width]);
	y = d3.scaleLinear().domain([0, 20]).range([height/5.5, 0]);
	z = d3.scaleLinear().domain([1.5, 7.5]).range([width * 1.2, 0]);

	// Grid
	line = d3.line().x(function(d){return x(d[0]) }).y(function(d){ return y(d[1])+z(d[2]) + margin.chart })
	for(chartx of [Leftchart, Rightchart]){
		// Holizontal
		for(var floor = 0; floor < 3 ;floor++){
			for(var h = 0; h < 3; h++){
				chartx.append("path")
					.attr("d", line([[0, h * 10, floor * 3 + 1.5], [50, h * 10, floor * 3 + 1.5]]))
					.attr("stroke", "black")
					.attr("fill", "none");
			}

		// Vertical
		for(var v = 0; v < 6; v++){
			chartx.append("path")
				.attr("d", line([[v * 10, 0, floor * 3 + 1.5], [v * 10, 20, floor * 3 + 1.5]]))
				.attr("stroke", "black")
				.attr("fill", "none");
		}
		// Floor label
		var label = 'F' + Number(floor+1)
		chartx.append("text")
			.attr("transform", translate(x(-2), y(0)+z(floor * 3 + 1.5)))
			.attr("text-anchor", "end")
			.style("font-size", "30px")
			.text(label);
		}
	}
	// Plot
	for(control of controllist){
		NODE = dataset[control][ss][drop]
		chartx = chartlist[controllist.indexOf(control)];
		chartx.append("text")
			.attr("transform", translate(width / 2, margin.top))
			.attr("text-anchor", "middle")
			.style("font-size", "50px")
			.text(control);
		for(var node in NODE){
			if(NODE[node]['act'] == 'AP'){	// AP
				chartx.selectAll('#' + ss + "_"+control + "_" + drop +"_" + node + "_Plot")
					.data([{x: x(NODE[node].x), y: y(NODE[node].y) + z(NODE[node].z)}])
					.enter()
					.append('path')
					.attr("d",d3.symbol().type(d3.symbolTriangle).size(120))
					.attr("id", ss + "_"+control + "_" + drop +"_" + node + "_Plot")
					.attr("fill", function(){
						if (controllist.indexOf(control) == 0)
							return "black"
						else
							return "black"
							//if (dataset[controllist[0]][ss][drop][node][flowval] < dataset[control][ss][drop][node][flowval])
							//	return "red"
							//else
							//	return "black"
						
					})	
					.attr("data-toggle", "tooltip")
					.attr("state","hidden")
					.attr("title", ToolTipInfo(ss + "_"+control + "_" + drop +"_" + node + "_Plot"))
					.attr("transform", function(d){ return translate(d.x, d.y + margin.chart); })
					.on("mouseover", function(){
						var id = d3.select(this).attr("id").split("_");
						ShowNodeInfo(id)
						attrRange(id,true)
					})
					.on("mouseout", function(){
						var id = d3.select(this).attr("id").split("_");
						ClearDetectLine()
						attrRange(id,false)
					})
					.on("click", function(){
						var id = d3.select(this).attr("id").split("_");
						console.log(id)
						Evaluate(id);
					});
				var sum = 0, count = 0;
				if (['thr','mcs','sinr'].indexOf(variable) >= 0){
					sum = NODE[node][flowval]
					count = 1
				}else{
					if (flow == 'D'){
						sum = NODE[node][flowval]
						count = 1
					}else{
						count = NODE[node]['Uflow_num']
						for(var sta of Assoc[node]){
							sum += NODE[sta][flowval]
						}
					}
				}
				
				chartx.append("text")
					.data([{x: x(NODE[node].x), y: y(NODE[node].y)+z(NODE[node].z)}])
					.attr("transform", function(d){
											corrctx = (node % 3 - 1) * 10;
											corrcty = ((node % 30 >= 2.0 && node % 30 <= 16) - 0.5 )* 50;
											return translate(d.x + corrctx, d.y + margin.chart + corrcty);
											
										})
					.attr("text-anchor", "middle")
					.style("font-size", "20px")// show AP info
					.text(function(){
						//return (sum / count).toFixed(1);
						return "";
					});
			}else if(NODE[node]['act'] == 'STA' && rolelist.indexOf(NODE[node]['role']) != -1){	// Active STA
				chartx.selectAll('#'+ ss+"_"+control+"_"+drop+"_"+node+ "_Plot")
					.data([{x: x(NODE[node].x), y: y(NODE[node].y)+z(NODE[node].z)}])
					.enter()
					.append('circle')
					.attr("id", ss+"_"+control+"_"+drop+"_"+node+"_Plot")
					.attr('cx', function(d) { return d.x; })
					.attr('cy', function(d) { return d.y + margin.chart; })
					.attr('r',x(cr[ss]))
					.attr("fill", function() {
						/*if(flow == 'D' && flowval != 'Dthr' && flowval != 'Dmcs') 
							return color(NODE[NODE[node].bss][flowval]);
						else 
							return color(NODE[node][flowval])*/
						return "blue"
					})
					.attr('data-toggle', 'tooltip')
					.attr("state","hidden")
					.attr("title", ToolTipInfo(ss + "_"+control + "_" + drop +"_" + node + "_Plot"))
					.on("mouseover", function(){
						var id = d3.select(this).attr("id").split("_")
						ShowNodeInfo(id)
						attrRange(id,true)
					})
					.on("mouseout", function(){
						var id = d3.select(this).attr("id").split("_")
						ClearDetectLine()
						attrRange(id,false)
					})
					.on("click", function(){
						var id = d3.select(this).attr("id").split("_")
						Evaluate(id)
					});
			}
		}
	}
}

function ToolTipInfo(sid) {
	var id = sid.split("_")
	var nodeset = dataset[id[1]][id[0]][id[2]][Number(id[3])]
	var str = ''
	table = []
	table.unshift('<table border = "1" style="font-size: 10pt;">')
	table.push('</table>')
	table.splice(table.length -1 ,0 ,'<td>Node No.</td><td>' + nodeset['node']+ '</td><td>BSS No.</td><td>' + nodeset['bss']  + '</td>')
	table.splice(table.length -1 ,0 ,'<td>Assoc</td><td>' + nodeset['assoc']  + '</td><td>App.</td><td>' + nodeset['role']  + '</td>')
	table.splice(table.length -1 ,0 ,'<td>Pos</td><td>[' + nodeset['x']  + ',' + nodeset['y'] + ',' + nodeset['z']  + ']</td>')
	table.splice(table.length -1 ,0 ,'<td>TxP</td><td>' + nodeset['txp']  + ' dBm</td><td>CCAT</td><td>' + nodeset['ccat']  + ' dBm</td>')
	table.splice(table.length -1 ,0 ,'<th colspan = "4">Downlink</th>')
	table.splice(table.length -1 ,0 ,'<td>Traffic</td><td>' + nodeset['Dtraf'] + ' Mbps </td><td>Throughput</td><td>' + nodeset['Dthr'] + ' Mbps </td>')
	table.splice(table.length -1 ,0 ,'<td>MCS</td><td>' + nodeset['Dmcs'] + '</td><td>SINR</td><td>' + nodeset['Dsinr'] + '</td>')
	table.splice(table.length -1 ,0 ,'<th colspan = "4">Uplink</th>')
	table.splice(table.length -1 ,0 ,'<td>Traffic</td><td>' + nodeset['Utraf'] + ' Mbps </td><td>Throughput</td><td>' + nodeset['Uthr'] + ' Mbps </td>')
	table.splice(table.length -1 ,0 ,'<td>MCS</td><td>' + nodeset['Umcs'] + '</td><td>SINR</td><td>' + nodeset['Usinr'] + '</td>')
	table.splice(table.length -1 ,0 ,'<th colspan = "4">Time</th>')
	table.splice(table.length -1 ,0 ,'<td>idle</td><td>' + nodeset['idle']  + ' sec</td><td>busy</td><td>' + nodeset['busy']  + ' sec</td>')
	table.splice(table.length -1 ,0 ,'<td>txtime</td><td>' + nodeset['txtime']  + ' sec</td><td>rxtime</td><td>' + nodeset['rxtime']  + 'sec</td>')

	

	
	for (let i in table){
		str += (i == 0 || i == table.length) ? table[i] : '<tr>' + table[i] + '</tr>'
	}
	
	return str
}

function Enabled_tooltips(){
	$('[data-toggle="tooltip"]')
	.tooltip({
		html: true,
		animation: false,
		placement: "bottom",
		container: "body",
		offset: '[0, 20]',
		delay: { "show": 0, "hide": 100}
	});
	$('[data-toggle="tooltip"]').on('shown.bs.tooltip', function () {
		var clicked_item = $(this)
		var clicked_item_id = clicked_item.attr("id").split("_");
		clicked_item.attr("state","show")
		clicked_item_id[1] = controllist[0] == clicked_item_id[1] ? controllist[1] : controllist[0]
		interlocked_item_id = "#" + clicked_item_id.join("_")
		interlocked_item = $(interlocked_item_id)
		if (interlocked_item.attr("state") == 'hidden'){
			interlocked_item.attr("state","show")
			interlocked_item.tooltip("show");
		}
	}).on('hidden.bs.tooltip', function () {
		var clicked_item = $(this)
		var clicked_item_id = clicked_item.attr("id").split("_");
		clicked_item.attr("state","hidden")
		clicked_item_id[1] = controllist[0] == clicked_item_id[1] ? controllist[1] : controllist[0]
		interlocked_item_id = "#" + clicked_item_id.join("_")
		interlocked_item = $(interlocked_item_id)
		if (interlocked_item.attr("state") == 'show'){
			interlocked_item.attr("state","hidden")
			interlocked_item.tooltip("hide");
		}
	});		
}
// Update Button Click
function Update() {
	var promise = new Promise((resolve, reject) => {
		d3.select("#chart").remove();
		resolve()
		dispLoading("Now Loading...");
	})
	promise.then((msg) => { 
		return new Promise((resolve, reject) => {
		setTimeout(() => {
			construct();
			input.src.value = "";
			input.dest.options.length = 0;
			Plot(ss, drop, flow, variable);
			STAplot(ss, drop)
			APplot(ss, drop)
			Evalplot(ss);
			Enabled_tooltips();
			resolve();
		}, 1000)
		})
	}).then((msg) => {
		removeLoading();
	})

}
// Change src Node
function SChange() {
	src = Number(input.src.value);
	var dest = input.dest;
	dest.options.length = 0, j = 0;
	if(1 < src && src < END_AP[ss]){
		for(var i = 0; i < STAPERBSS[ss]; i++){
			dest.options[j++] = new Option(Assoc[src][i], Assoc[src][i]);
		}
		DChange();
	}else if(END_AP[ss] <= src && src < END_NODE[ss]){//STA
		dest.options[0] = new Option(Assoc[src], Assoc[src]);
		DChange();
	}else{
		dest.options.length = 0;
	}
}
// Change dest Node
function DChange() {
	src = Number(input.src.value),
	dest = Number(input.dest.value);
	var dis = Math.sqrt((NODE[src]['x'] - NODE[dest]['x'])**2 + (NODE[src]['y'] - NODE[dest]['y'])**2 + (NODE[src]['z'] - NODE[dest]['z'])**2)
	document.getElementById('distance').innerHTML = dis.toFixed(1) + ' m';
}

// Show Detect Line Button Click
function ShowDetectLine() {
	//ClearDetectLine()
	for(control of controllist){
		chartx = chartlist[controllist.indexOf(control)],
		sbss = 0, aps = 0, hid = 0;
		for(var detect of dataset[control][ss][drop][dest].dsc){
			if(rolelist.indexOf(NODE[detect]['role']) != -1){
				var p = chartx.append("path")
					.attr("d", line([[NODE[dest].x, NODE[dest].y, NODE[dest].z], [NODE[detect].x, NODE[detect].y, NODE[detect].z]]))
					.attr("class", "mouse-line_" + control + src + '_' + dest)
					.style("stroke-width", "1px")
					.style("opacity", "0.5");
				if(NODE[detect].act == 'AP') aps++;
				if(NODE[detect].bss == NODE[dest].bss){	// AP
					p.style("stroke", "black");
					sbss++;
				}else if(NODE[src].dsc.indexOf(detect) == -1){	// Hidden terminal for UL
					p.style("stroke", "red");
					hid++;
				}else p.style("stroke", "black");	// other
			}
		}
	}

	presource = src
	predestination = dest
}

// Clear Detect Line
function ClearDetectLine() {
	$('path[class^=mouse-line]').remove()
}

function attrRange(id,bool){
	fid = id.slice(0, 1).join('_')
	bid = id.slice(2, 4).join('_') 
	if (bool){
		$('circle[id^=' + fid + '][id*=' + bid + '_]').attr('r', x(CR[ss]))
	}else{
		$('circle[id^=' + fid + '][id*=' + bid + '_]').attr('r', x(cr[ss]))
	}
}
// Mouseover
function ShowNodeInfo(id) {
	for(var control of controllist){
		var node = Number(id[3]),PLOT = dataset[control][ss][drop][node],sbss = 0, aps = 0, hid = 0;
		for(var detect of PLOT.dsc){
			if(rolelist.indexOf(NODE[detect].role) != -1){
				var p = chartlist[controllist.indexOf(control)].append("path")
					.attr("d", LinefromEdge(PLOT,NODE[detect]))
					.attr("class", "mouse-line_"+control+id[3])
					.style("stroke-width", "1px")
					.style("opacity", "0.5");
				if(NODE[detect].act == 'AP'){
					aps++;
				}else if(NODE[detect].bss == PLOT.bss){	// AP
					p.style("stroke", "black")
					sbss++;
				}else if(NODE[PLOT.bss].dsc.indexOf(detect) == -1){
					p.style("stroke", "blue");
					hid++;
				}else p.style("stroke", "red");	// other
			}
		}
	}
}
// Evaluation Constructor
function Evalplot(ss){
	// Constructor
	evalchart = svg.append("g")
		.attr("id", "evalchart")
		.attr("transform", translate(cwidth + (width + margin.space) * 2 + margin.left ,margin.top + margin.space * 2));

	// Datalist
	datalist = []

	// Axis scale
	Evalx = d3.scaleBand().rangeRound([0, Ewidth]).padding(0.1);
	Evaly = {}
	evalchartdict = {}
	var index = 0
	for(var evaly of Object.keys(chartlabel)){
		if(['node', 'dis', 'txp', 'ccat', 'notdetect'].indexOf(evaly) != -1) continue;
		Evaly[evaly] = d3.scaleLinear().domain([axisrange[ss]['Common']['Min'][evaly],axisrange[ss]['Common']['Max'][evaly]]).range([Eheight, 0]);
		evalchartdict[evaly] = evalchart.append("g").attr("transform", translate((Ewidth + margin.left )* ( index % 5), (Eheight + margin.space * 1.5) * Math.floor(index / 5)))
		index++;
	}

	//Title
	evalchart.append("text")
		.attr("transform", translate((Ewidth + margin.left ) * 2.5,-margin.space))
		.attr("text-anchor", "middle")
		.style("font-size", "80px")
		.text("Evaluate");

	for(var i of Object.keys(evalchartdict)){
		// Title
		evalchartdict[i].append("text")
			.style("fill", "black")
			.style("font-size", "40px")
			.style("text-anchor", "middle")
			.attr("transform", translate(Ewidth/1.8, 0))
			.text(chartlabel[i]);
		// X Axis
		evalchartdict[i].append("g")
			.attr("id", "x_axis")
			.attr("transform",translate(0,Eheight))
			.call(d3.axisBottom(Evalx));
		// Y Axis
		evalchartdict[i].append("g")
			.attr("id", "y_axis")
			.attr("transform", translate(0,0))
			.call(d3.axisLeft(Evaly[i]).ticks(5))
			.style("font-size", "15px")
		
		// Unit label
		evalchartdict[i].append("text")
			.style("fill", "black")
			.style("font-size", "15px")
			.style("text-anchor", "middle")
			.attr("transform", translate(0,-15))
			.text('[' + unitlabel[i] + ']');
		evalchartdict[i].selectAll('rect')
			.data(datalist)
			.enter()
			.append('rect')
			.attr('id', 'evalchart'+i)
			.attr('x', 0)
			.attr('y', 0)
			.attr("width", 0)
			.attr("height", 0)
			.attr("fill", "none");
		evalchartdict[i].selectAll("text")
			.data(datalist)
			.enter()
			.append("text")
			.attr('id', 'datalabel'+i)
			.attr("x", function(d) { return Evalx(d.label); })
			.attr("y", function(d) { return Evaly[i](d[i]); })
			.text(function(d){ return d[i]; });
	}
}
// Evaluation Draw Bar
function Evaluate(id){
	for(var control of controllist){
		var node = Number(id[3]),
			flag = true,
			xlabel = control + ' ' + node;
		for(var i in datalist){
			if(datalist[i].label == xlabel){
				datalist.splice(i, 1);
				flag = false;
				break;
			}
		}
		if(flag){
			var d = {'label': xlabel}
			for(var k in evalchartdict){
				d[k] = dataset[control][ss][drop][node][k]
			}
			datalist.push(d)
		}
		// Axis scale
		Evalx.domain(datalist.map(function(d){ return d.label; }));

		for(var i of Object.keys(evalchartdict)){
			// Reset
			evalchartdict[i].selectAll('rect').remove();
			evalchartdict[i].selectAll('.datalabel').remove();
			// X Axis
			evalchartdict[i].select('#x_axis')
				.call(d3.axisBottom(Evalx))
				.selectAll("text")
				.attr("id", "x_axis_label")
				.style("text-anchor", "end")
				.style("font-size", (Evalx.bandwidth() < 35 ? 20 * Evalx.bandwidth() / 35 : 20) + "px")
				.attr("dx", 0)
				.attr("dy", 0)
				.attr("transform", translate(0,10) + " rotate(-90)");
			// Bar
			var bar = evalchartdict[i].selectAll('rect')
				.data(datalist)
				.enter()
			// Rectangle
			bar.append('rect')
				.attr('id', function(d) { return 'bar'+i+d.label; })
				.attr('x', function(d){ return Evalx(d.label); })
				.attr('y', function(d) {
					var v = isNaN(d[i]) ? 0 : d[i]
					return Evaly[i](v);
				})
				.attr("width", Evalx.bandwidth())
				.attr("height", function(d) {
					var v = isNaN(d[i]) ? 0 : d[i]
					return Eheight - Evaly[i](v) ;
				})
				.attr("fill", function(d) { return controlcolor[d.label.split(' ')[0]]; });
				
			// Datalabel
			bar.append("text")
				.attr('class', 'datalabel')
				.attr('fill', function(d){
					var v = isNaN(d[i]) ? 0 : d[i],
					size = Evalx.bandwidth() < 45 ? 20 * Evalx.bandwidth() / 45 : 20;
					return Eheight - Evaly[i](v) < size ? "black" : "white";
				})
				.style("text-anchor", "middle")
				.style("font-size", function(){
					var size = Evalx.bandwidth() < 45 ? 20 * Evalx.bandwidth() / 45 : 20;
					return size + "px"
				})
				.attr("x", function(d) { return Evalx(d.label)+Evalx.bandwidth() / 2; })
				.attr("y", function(d) {
					var v = isNaN(d[i]) ? 0 : d[i],
					size = Evalx.bandwidth() < 45 ? 20 * Evalx.bandwidth() / 45 : 20;
					return Eheight - Evaly[i](v) < size ? Evaly[i](v)-3 : Evaly[i](v)+size;
				})
				.attr('dx', '0em')
				.attr('dy', '0em')
				.text(function(d){
					var n = new Number(d[i])
					if(d[i] < 1) return n.toFixed(2);
					else if(d[i] >= 1000) return n;
					else return n.toPrecision(3);
				});
		}
	}
}
// STA Plot
function STAplot(ss, drop){
	// Constructor
	STAchart = svg.append("g")
		.attr("id", "STAchart")
		.attr("transform", translate(margin.left,margin.space + height + margin.top));
	STACbarchart = STAchart.append("g")
		.attr("id", "STACbarchart")
		.attr("transform", translate(-margin.left,0));
	STALeftchart = STAchart.append("g")
		.attr("id", "STALeftchart")
		.attr("transform", translate(cwidth,0));
	STARightchart = STAchart.append("g")
		.attr("id", "STARightchart")
		.attr("transform", translate(cwidth + Pwidth + margin.space,0));
	STAchartlist = [STALeftchart, STARightchart]
	//Title
	STAchart.append("text")
		.attr("transform", translate(cwidth + Pwidth + margin.space,-margin.space))
		.attr("text-anchor", "middle")
		.style("font-size", "80px")
		.text("STA");
	// axis scale
	var xval = input.STAplotx.value,
		yval = input.STAploty.value,
		cval = input.STAplotc.value;
	
	var STAplotx = xval == 'thr' || xval == 'mcs' || xval == 'sinr' ? flow + xval : xval,
		STAploty = yval == 'thr' || yval == 'mcs' || yval == 'sinr' ? flow + yval : yval;
		STAplotc = cval == 'thr' || cval == 'mcs' || cval == 'sinr' ? flow + cval : cval;

	// Color
	var Cdomain = [];
	for(var i = 0,len = Crange.length ; i < len ; i++){
		if(STAplotc == 'reover' || STAplotc == 'loss'){
			var m = (STAplotc == 'reover') ? 100*7/6 : 5*7/6;
			if(i < Crange.length-1) Cdomain.push(m*i/(Crange.length-1))
			else Cdomain.push(axisrange[ss]['STA']['Max'][STAplotc])
		}
		else Cdomain.push(axisrange[ss]['STA']['Max'][STAplotc] * i / (Crange.length-1))
	}

	var STAx = d3.scaleLinear().domain([axisrange[ss]['STA']['Min'][STAplotx], axisrange[ss]['STA']['Max'][STAplotx]]).range([0, Pwidth]),
		STAy = d3.scaleLinear().domain([axisrange[ss]['STA']['Min'][STAploty], axisrange[ss]['STA']['Max'][STAploty]]).range([Pwidth, 0]),
		STAc = d3.scaleLinear().domain(Cdomain).range(Crange);
	
	for(var control of controllist){
		STAchartx = STAchartlist[controllist.indexOf(control)]
		// Title
		STAchartx.append("text")
			.attr("transform", translate(Pwidth/2,-margin.space/2))
			.attr("text-anchor", "middle")
			.style("font-size", "50px")
			.text(control);
		STAchartx.append("text")
			.attr("transform", translate(Pwidth/2,-margin.space/2 + 30))
			.attr("text-anchor", "middle")
			.style("font-size", "30px")
			.text("correlation: " + makedict(control,STAplotx,STAploty));
		// X Axis
		STAchartx.append("g")
			.attr("class", "STAx_axis")
			.attr("transform",translate(0,Pwidth))
			.call(d3.axisBottom(STAx))
			.style("font-size", "15px")
			.append("text")
			.attr("id", "x_label")
			.style('fill', 'black')
			.attr("text-anchor", "middle")
			.style("font-size", "25px")
			.attr("transform", translate(Pwidth/2,60))
			.text(chartlabel[STAplotx]);
		// Y Axis
		STAchartx.append("g")
			.attr("class", "STAy_axis")
			.attr("transform", translate(0,0))
			.call(d3.axisLeft(STAy))
			.style("font-size", "15px")
			.append("text")
			.attr("id", "x_label")
			.style('fill', 'black')
			.attr("text-anchor", "middle")
			.style("font-size", "25px")
			.attr("transform", translate(-60,Pwidth/2)+", rotate(-90)")
			.text(chartlabel[STAploty]);
	}
	// Cbar label
	STACbarchart.append("text")
		.attr("transform", translate(cwidth/2, margin.top/2))
		.attr("text-anchor", "middle")
		.style("font-size", "20px")
		.text('Color Scheme');
	STACbarchart.append("text")
		.attr("transform", translate(cwidth/2, margin.top/2+25))
		.attr("text-anchor", "middle")
		.style("font-size", "20px")
		.text(chartlabel[STAplotc]);
	STACbarchart.append("text")
		.attr("transform", translate(cwidth/2, margin.top/2+50))
		.attr("text-anchor", "middle")
		.style("font-size", "24px")
		.text('['+unitlabel[STAplotc]+']');
	// Cbar
	cbar = STACbarchart.selectAll(".cbar")
		.data(Cdomain.reverse())
		.enter().append("g")
		.attr("class", "cbar")
		.attr("transform", function(d, i) { return translate(cwidth/3,100+i*25); })
		.style("font-size", "20px");
	cbar.append("rect")
		.attr("x", 0)
		.attr("width", 20)
		.attr("height", 20)
		.attr("fill", STAc);
	cbar.append("text")
		.attr("x", 30)
		.attr("y", 20)
		.attr("text-anchor", "start")
		.text(function(d) {return Math.floor(d*Math.pow(10,1))/Math.pow(10,1); });	
	
	STAdset = {}
	for(var control of controllist){
		STAdset[control] = {}
		for(var k of Object.keys(dataset[control][ss][drop])){
			var a = dataset[control][ss][drop][k];
			if(a.act != 'AP' && a[STAplotx] !== undefined && a[STAploty] !== undefined && a[STAplotc] !== undefined){
				STAdset[control][k] = {'x':a[STAplotx], 'y':a[STAploty], 'c':a[STAplotc]}
			}
		}
		for(var node in STAdset[control]){
			if (rolelist.indexOf(NODE[node]['role']) != -1){
				STAchartlist[controllist.indexOf(control)]
					.append('circle')
					.attr('id', ss+'_'+control+'_'+drop+'_'+node+'_STA')
					.attr('cx', STAx(STAdset[control][node].x))
					.attr('cy', STAy(STAdset[control][node].y))
					.attr('r', x(cr[ss]))
					.attr('fill', STAc(STAdset[control][node].c))
					.attr("data-toggle", "tooltip")
					.attr("state","hidden")
					.attr("title", ToolTipInfo(ss + "_"+control + "_" + drop +"_" + node + "_Plot"))
					.on('mouseover', function(){
						var id = d3.select(this).attr("id").split("_");
						for(var control of controllist){
							id[1] = control
							ShowNodeInfo(id)
						}
						attrRange(id,true)
					})
					.on("mouseout", function(){
						var id = d3.select(this).attr("id").split("_");
						ClearDetectLine()
						attrRange(id,false)
					})
					.on("click." + node, function(){
						var id = d3.select(this).attr("id").split("_")
						for(var control of controllist){
							id[1] = control
							Evaluate(id);
						}
					});
			}		
		}
	}
}
// AP Plot
function APplot(ss, drop){
	// Constructor
	APchart = svg.append("g")
		.attr("id", "APchart")
		.attr("transform", translate(margin.left, margin.space * 4 + Pwidth + height + margin.top));
	APCbarchart = APchart.append("g")
		.attr("id", "APCbarchart")
		.attr("transform", translate(-margin.left,0));
	APLeftchart = APchart.append("g")
		.attr("id", "APLeftchart")
		.attr("transform", translate(cwidth,0));
	APRightchart = APchart.append("g")
		.attr("id", "APRightchart")
		.attr("transform", translate(cwidth + Pwidth + margin.space,0));
	APchartlist = [APLeftchart, APRightchart]
	//Title
	APchart.append("text")
		.attr("transform", translate(cwidth + Pwidth + margin.space, -margin.space))
		.attr("text-anchor", "middle")
		.style("font-size", "80px")
		.text("AP");
	// axis scale
	
	var xval = input.APplotx.value;
		yval = input.APploty.value;
		cval = input.APplotc.value;
	
	var APplotx = xval == 'thr' || xval == 'mcs' || xval == 'sinr' ? flow + xval : xval,
		APploty = yval == 'thr' || yval == 'mcs' || yval == 'sinr'  ? flow + yval : yval,
		APplotc = cval == 'thr' || cval == 'mcs' || cval == 'sinr' ? flow + cval : cval;

	// Color
	var Cdomain = [];
	for(var i = 0,len = Crange.length; i < len ; i++){
		if(APplotc == 'reover' || APplotc == 'loss'){
			var m = (APplotc == 'reover') ? 100 * 7 / 6 : 5 * 7 / 6;
			if(i < Crange.length-1) Cdomain.push(m*i/(Crange.length-1))
			else Cdomain.push(axisrange[ss]['AP']['Max'][APplotc])
		}
		else Cdomain.push(axisrange[ss]['AP']['Max'][APplotc]*i/(Crange.length-1))
	}
	var APx = d3.scaleLinear().domain([axisrange[ss]['AP']['Min'][APplotx], axisrange[ss]['AP']['Max'][APplotx]]).range([0, Pwidth]),
		APy = d3.scaleLinear().domain([axisrange[ss]['AP']['Min'][APploty], axisrange[ss]['AP']['Max'][APploty]]).range([Pwidth, 0]),
		APc = d3.scaleLinear().domain(Cdomain).range(Crange);
	
	
	for(var control of controllist){
		
		APchartx = APchartlist[controllist.indexOf(control)]
		APchartx.append("text")
			.attr("transform", translate(Pwidth/2, -margin.space/2))
			.attr("text-anchor", "middle")
			.style("font-size", "50px")
			.text(control);
		APchartx.append("text")
			.attr("transform", translate(Pwidth/2, -margin.space/2 + 30))
			.attr("text-anchor", "middle")
			.style("font-size", "30px")
			.text("correlation: " + makedict(control,APplotx,APploty));
		// X Axis
		APchartx.append("g")
			.attr("class", "APx_axis")
			.attr("transform",translate(0,Pwidth))
			.call(d3.axisBottom(APx))
			.style("font-size", "15px")
			.append("text")
			.attr("id", "x_label")
			.style('fill', 'black')
			.attr("text-anchor", "middle")
			.style("font-size", "25px")
			.attr("transform", translate(Pwidth/2,60))
			.text(chartlabel[APplotx]);
		// Y Axis
		APchartx.append("g")
			.attr("class", "APy_axis")
			.attr("transform", translate(0,0))
			.call(d3.axisLeft(APy))
			.style("font-size", "15px")
			.append("text")
			.attr("id", "x_label")
			.style('fill', 'black')
			.attr("text-anchor", "middle")
			.style("font-size", "25px")
			.attr("transform", translate(-60,Pwidth/2)+", rotate(-90)")
			.text(chartlabel[APploty]);
	}
	// Cbar label
	APCbarchart.append("text")
		.attr("transform", translate(cwidth/2, margin.top/2))
		.attr("text-anchor", "middle")
		.style("font-size", "20px")
		.text('Color Scheme');
	APCbarchart.append("text")
		.attr("transform", translate(cwidth/2, margin.top/2+25))
		.attr("text-anchor", "middle")
		.style("font-size", "20px")
		.text(chartlabel[APplotc]);
	APCbarchart.append("text")
		.attr("transform", translate(cwidth/2, margin.top/2+50))
		.attr("text-anchor", "middle")
		.style("font-size", "24px")
		.text('['+unitlabel[APplotc]+']');
	// Cbar
	cbar = APCbarchart.selectAll(".cbar")
		.data(Cdomain.reverse())
		.enter().append("g")
		.attr("class", "cbar")
		.attr("transform", function(d, i) { return translate(cwidth/3,100+i*25); })
		.style("font-size", "20px");
	cbar.append("rect")
		.attr("x", 0)
		.attr("width", 20)
		.attr("height", 20)
		.attr("fill", APc);
	cbar.append("text")
		.attr("x", 30)
		.attr("y", 20)
		.attr("text-anchor", "start")
		.text(function(d) { return Math.floor(d*Math.pow(10,1))/Math.pow(10,1); });	
	APdset = {}	
	for(var control of controllist){
		APdset[control] = {}
		for(var k of Object.keys(dataset[control][ss][drop])){
			var a = dataset[control][ss][drop][k];
			if(a.act == 'AP') APdset[control][k] = {'x':a[APplotx], 'y':a[APploty], 'c':a[APplotc]}
		}
		for(var node in APdset[control]){
			APchartlist[controllist.indexOf(control)].append('circle')
				.attr('id', ss+'_'+control+'_'+drop+'_'+node+'_AP')
				.attr('cx', APx(APdset[control][node].x))
				.attr('cy', APy(APdset[control][node].y))
				.attr('r', x(cr[ss]))
				.attr('fill', APc(APdset[control][node].c))
				.attr("data-toggle", "tooltip")
				.attr("state","hidden")
				.attr("title", ToolTipInfo(ss + "_"+control + "_" + drop +"_" + node + "_Plot"))
				.on('mouseover', function(){
					var id = d3.select(this).attr("id").split("_");
					for(var control of controllist){
						//id[1] = control
						ShowNodeInfo(id)
					}
					attrRange(id,true)
				})
				.on("mouseout", function(){
					var id = d3.select(this).attr("id").split("_");
					ClearDetectLine()
					attrRange(id,false)
				})
				.on("click." + node, function(){
					var id = d3.select(this).attr("id").split("_")
					for(var sta of Assoc[Number(id[3])]){
						if(NODE[sta].act == 'STA'){
							id[3] = sta;
							Evaluate(id);
						}
					}
				});
		}
	}
}

function makedict(control,xval,yval){
	var array_x = [],
		array_y = [],
		arraylist = [array_x,array_y],
		vallist = [xval,yval],
		start = 0
		
	for (var val of vallist){
		start = vallist.indexOf(val,start)
		for (var node in dataset[control][ss][drop]){
			if (rolelist.indexOf(NODE[node]['role']) != -1){
				arraylist[start].push(dataset[control][ss][drop][node][val])
			}
		}
		start++;
	}
	return Correl(arraylist[0],arraylist[1])
}

function Correl(xx,yy){ //xx yy is array.
	var m = Math,n;

	if (xx.length == yy.length){
		var n = xx.length, sumx=0, sumy=0,xm ,ym ,sumxxm=0, sumyym=0, sumxym=0;
		for(var i = 0; i < n; i++){
		  sumx += xx[i]; //xxの総和
		  sumy += yy[i]; //yyの総和
		}
	
		xm = sumx / n; //xxの平均
		ym = sumy / n; //yyの平均
		
		for(var i = 0; i < n; i++){
			sumxxm += (xx[i] - xm) * (xx[i] - xm); //(xi-average(x))^2
			sumyym += (yy[i] - ym) * (yy[i] - ym);
			sumxym += (xx[i] - xm) * (yy[i] - ym); //(xi-average(x))*(yi-average(y))
		}  
		
		correl = (sumxym / m.sqrt(sumxxm * sumyym)).toFixed(3)
		return correl; // = sumxym/Math.sqrt(sumxxm*sumyym); //sqrtは平方根を返す
		
	}else{
		throw new Error("Array length is not same.");
	}
}
// Translation
function translate(x, y){ 
	return 'translate(' + x + ',' + y + ')' 
}

function LinefromEdge(plot1, plot2){
	var p1 = {x: x(plot1.x), y: y(plot1.y) + z(plot1.z)}
	var p2 = {x: x(plot2.x), y: y(plot2.y) + z(plot2.z)}
	var deltay = p2.y - p1.y, deltax = p2.x - p1.x
	var newplot = {}
	newplot.x = p1.x + deltax * x(CR[ss]) / ((deltax**2 + deltay**2)**0.5)
	newplot.y = p1.y + deltay * x(CR[ss]) / ((deltax**2 + deltay**2)**0.5)
	var edgeline = d3.line().x(function(d){return d.x }).y(function(d){ return d.y + margin.chart })
	return edgeline([{x: newplot.x, y: newplot.y},{x:p2.x, y:p2.y}])
}

function dispLoading(msg){
  // 引数なし（メッセージなし）を許容
  if( msg == undefined ){
    msg = "";
  }
  // 画面表示メッセージ
  var dispMsg = "<div class='loadingMsg'>" + msg + "</div>";
  // ローディング画像が表示されていない場合のみ出力
  $("#insert_svg").append("<div id='loading'>" + dispMsg + "</div>");
}
 
/* ------------------------------
 Loading イメージ削除関数
 ------------------------------ */
function removeLoading(){
  $("#loading").remove();
}