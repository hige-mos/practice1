import math
import sys
import glob
import re
import json
import pandas as pd
import collections
### function part ###
def getdest():
	for line in open (glob.glob('./statFiles/' + control + '*' + ss + '*' + drop +'.config')[0], 'r',encoding="utf-8_sig").readlines():
		if line.find('cbr-destination') != -1:
			data = line[:-1].split()
			snode = int(re.split('\[|-|;|\]|flow',data[0])[1])
			dnode = int(data[3])
			dict[snode]['bss'] = snode if snode < ssinfo[ss]['apnum'] + 2 else dnode
			dict[snode]['assoc'].append(dnode)

def gettraf():
	for line in open (glob.glob('./statFiles/' + control + '*' + ss + '*' + drop +'.config')[0], 'r',encoding="utf-8_sig").readlines():
		if line.find('cbr-traffic-bps =') != -1:
			data = line[:-1].split()
			flow = re.split('\[|-|;|\]|flow',data[0])
			snode = int(flow[1])
			dnode = int(flow[3])
			traf = int(data[3]) / mbps
			if(snode < ssinfo[ss]['apnum'] + 2 and dict[snode]['Dflow_num'] != 0):
					dict[snode]['Dtraf'] += traf if dict[snode]['Dflow_num'] != 0 else 0
					dict[dnode]['Dtraf'] += traf if dict[dnode]['Dflow_num'] != 0 else 0
			elif(snode >= ssinfo[ss]['apnum'] + 2):
				if (dict[snode]['Uflow_num'] != 0):
					dict[snode]['Utraf'] += traf  if dict[snode]['Uflow_num'] != 0 else 0
					dict[dict[snode]['bss']]['Utraf'] += traf if dict[dict[snode]['bss']]['Uflow_num'] != 0 else 0
				else:
					dict[snode]['Umcs'] = 0
							
def getmcs():
	for line in open (glob.glob('./statFiles/' + control + '*' + ss + '*' + drop +'.config')[0], 'r',encoding="utf-8_sig").readlines():
		if line.find('dot11-modulation-and-coding-table') != -1:
			data = line[:-1].replace(':',' ').replace(';',' ').replace('[','').replace(']','').replace('"','').split()
			snode = int(data[0])
			for i in range(4,len(data),2):
				if (snode < ssinfo[ss]['apnum'] + 2):
					dict[int(data[i])]['Dmcs'] = MCS[data[i+1]] / dict[int(data[i])]['Dflow_num'] if dict[int(data[i])]['Dflow_num'] != 0 else 0
					dict[snode]['Dmcs'] += MCS[data[i+1]] / dict[snode]['Dflow_num'] if dict[int(data[i])]['Dflow_num'] != 0 else 0
				else:
					dict[snode]['Umcs'] += MCS[data[i+1]] / dict[snode]['Uflow_num'] if dict[snode]['Uflow_num'] != 0 else 0
					dict[int(data[i])]['Umcs'] += MCS[data[i+1]] / dict[int(data[i])]['Uflow_num'] if dict[int(data[i])]['Uflow_num'] != 0 else 0

def getphystat():
	for line in open (glob.glob('./statFiles/' + control + '*' + ss + '*' + drop +'.phystat')[0], 'r',encoding="utf-8_sig").readlines():
		if line.find('TotalSINRDist') != -1:
			sum_db = 0
			count = 0
			data = line[:-1].split()
			node = int(data[1])
			for i in range(3,len(data)):
				db = i - 33
				count += int(data[i])
				sum_db += db * int(data[i])
			if node < ssinfo[ss]['apnum'] + 2:
				dict[node]['Usinr'] = sum_db / count
				for assoc in dict[node]['assoc']:
					dict[assoc]['Usinr'] = sum_db / count
			else:
				dict[node]['Dsinr'] = sum_db / count
				for assoc in dict[node]['assoc']:
					dict[assoc]['Dsinr'] += sum_db / count / dict[assoc]['Dflow_num'] if dict[node]['Dflow_num'] != 0 else 0
					

def getstime():
	for line in open (glob.glob('./statFiles/' + control + '*' + ss + '*' + drop +'.config')[0], 'r',encoding="utf-8_sig").readlines():
		if line.find('cbr-start-time =') != -1:
			data = line[:-1].split()
			flow = re.split('\[|-|;|\]|flow',data[0])
			snode = int(flow[1])
			dnode = int(flow[3])
			stime = float(data[3])
			if(snode < ssinfo[ss]['apnum'] + 2 and stime <= simtime):
				dict[snode]['Dflow_num'] += 1 
				dict[dnode]['Dflow_num'] += 1 
			elif(snode >= ssinfo[ss]['apnum'] + 2 and stime <= simtime):
				dict[snode]['Uflow_num'] += 1 
				dict[dict[snode]['bss']]['Uflow_num'] += 1
			
def getpos():
	for line in open('./pos/' + ss + '_sample_Drop'+ drop +'.pos', 'r',encoding="utf-8_sig").readlines():
		data = line[:-1].split()
		node = int(data[0])
		if node == 1: continue
		dict[node]['node'] = node
		dict[node]['x'] = float(data[2])
		dict[node]['y'] = float(data[3])
		dict[node]['z'] = float(data[4])
		dict[node]['act'] = 'AP' if node < ssinfo[ss]['apnum'] + 2 else 'STA'
		dict[node]['ss'] = ss
		dict[node]['control'] = control
		dict[node]['drop'] = drop
		dict[node]['assoc'] = []

def gettime():
	for line in open (glob.glob('./statFiles/' + control + '*' + ss + '*' + drop + '.phystat')[0], 'r',encoding="utf-8_sig").readlines():
		if line.find('TimeRatio') != -1:
			data = line[:-1].split()
			node = int(data[1])
			dict[node]['idle'] = float(data[4])
			dict[node]['busy'] = float(data[6])
			dict[node]['txtime'] = float(data[8])
			dict[node]['rxtime'] = float(data[10])
			dict[node]['rxtimeme'] = float(data[12])
			dict[node]['rxtimes'] = float(data[14])
			dict[node]['rxtimeo'] = float(data[16])

def getstat():
	Txpower = {}
	CCASD = {}
	Prop = {}

	for line in open (glob.glob('./statFiles/' + control + '*' + ss + '*' + drop + '.stat')[0], 'r',encoding="utf-8_sig").readlines():
		data = line[:-1].split()
		if line.find('Dot11Phy_dot11g_DataForMe_NotDetectDueToLevel') != -1:
			dict[int(data[0])]['notdetect'] = int(data[3])
		elif line.find('txPowerDbm') != -1:
			if data[3] != '-':
				dict[int(data[0])]['txp'] = float(data[3])
				Txpower[int(data[0])] = float(data[3])
			else:
				dict[int(data[0])]['txp'] = 0
				Txpower[int(data[0])] = 0
		elif line.find('preambleDetectionThresholdDbm') != -1:
			data = line[:-1].split()[13:-1]  # data between 7 and 27
			while "-" in data :
				data.remove("-")
			dict[int(line.split()[0])]['ccat'] = sum([float(x) for x in data])/len(data) if len(data) != 0 else 0
			CCASD[int(line.split()[0])] = sum([float(x) for x in data])/len(data) if len(data) != 0 else 0
		elif line.find('Dot11Mac_dot11g_Data_AggregateFramesSent') != -1:
			dict[int(data[0])]['dsent'] = int(data[3])
		elif line.find('dlflow') != -1 and line.find('BytesReceived') != -1:
			dict[int(data[0])]['Dthr'] = float(data[3])*8/(simtime-7)/mbps
			dict[dict[int(data[0])]['bss']]['Dthr'] += float(data[3])*8/(simtime-7)/mbps
		elif line.find('ulflow') != -1 and line.find('BytesReceived') != -1:
			dict[int(data[0])]['Uthr'] += float(data[3])*8/(simtime-7)/mbps
			dict[int(re.split('flow|_',data[1])[2])]['Uthr'] = float(data[3])*8/(simtime-7)/mbps

	for i,line in enumerate(open (glob.glob('./pos/PathLossMatrix_'+ ss + '.plm')[0], 'r',encoding="utf-8_sig").readlines()):
		node = range(2,ssinfo[ss]['nodenum'])
		if ssinfo[ss]['nodenum']*(int(drop)-1) <= i < ssinfo[ss]['nodenum']*int(drop):
			j = i - ssinfo[ss]['nodenum']*(int(drop)-1) + 2
			Prop[j] = {}
			for k in range(2,ssinfo[ss]['nodenum']):
				Prop[j][k] = float(line[:-1].split()[k-2])
				
	for n in node:
		DSC = []
		TPC = []
		for i in node:
			if n != i and i in Txpower and Txpower[i] - Prop[i][n] >= CCASD[n]: DSC.append(i)
			if n != i and i in Txpower and Txpower[n] - Prop[i][n] >= CCASD[i]: TPC.append(i)
		dict[n]['dsc'] = DSC
		dict[n]['tpc'] = TPC
		dict[n]['detect'] = len(DSC)
	
def getretry():
	for line in open (glob.glob('./statFiles/' + control + '*' + ss + '*' + drop + '.macstat')[0], 'r',encoding="utf-8_sig").readlines():
		if line.find('FreqDistOfMpduRetryCount') != -1:
			data = line[:-1].split()
			retrylist = []
			overhead = 0
			node = int(data[1])
			for i,v in enumerate(range(5,15)):
				retrylist.append(int(data[v]))
				overhead += int(data[v]) * i
			retrylist.append(int(data[24]))
			overhead += retrylist[10] * 9
			dict[node]['sent'] = sum(retrylist)
			dict[node]['reover'] = float(overhead) * 100 / sum(retrylist) if sum(retrylist) != 0 else 0
			dict[node]['loss'] = float(retrylist[10]) * 100 / sum(retrylist) if sum(retrylist) != 0 else 0

def printconfig():
	for i in range(0,len(Scenariolist)):
		print("Scenario: " + Scenariolist[i])
	print("Num of Drops: " + str(dropnum))
	print("Simlation Time: " + str(simtime) + ' s')
	print("Training Time: " + str(traintime) + ' s')
	for i in range(0,len(Controllist)):
		print("Method " + str(i)  + ": " + Controllist[i])

def p(s):		#not \n
	print(s,end = ' ')
	sys.stdout.flush()

def pn(s):
	print(s)
	sys.stdout.flush()

def dict_to_dframe():
	var_df = pd.DataFrame()
	for ss,SS in datadict.items():
		for control,CONTROL in SS.items():
			for drop,DROP in CONTROL.items():
				for node,NODE in DROP.items():
					keys = []
					vals = []
					for k,v in NODE.items():
						#print(k,v)
						keys.append(k)
						vals.append(v)
					tmp_se = pd.Series(vals, index = keys)
					var_df = var_df.append(tmp_se,ignore_index=True)
	return var_df

def assignrole():
	for node in range(2,ssinfo[ss]['nodenum'] + 2):
		if node >= ssinfo[ss]['apnum'] + 2:
			for d in roledict:
				if (dict[node]['Utraf'] == roledict[d]['Utraf'] and dict[node]['Dtraf'] == roledict[d]['Dtraf']):
					dict[node]['role'] = d
		else:
			dict[node]['role'] = 'AP'
			
def round_dict():
	for ss,SS in controldict[control].items():
		for drop,DROP in SS.items():
			for node,NODE in DROP.items():
				for k,v in NODE.items():
					if type(v) is float or type(v) is int:
						NODE[k] = round(v,1)
						

### load part ###
with open('./jsonFiles/allconfig.json', encoding='utf-8') as f:
    allconfig = json.load(f)

### initialization part ###
dframe = pd.DataFrame()
simtime = allconfig['sim_time']
traintime = allconfig['train_time']
mbps = allconfig['mbps']
Controllist = allconfig['control']
ss = allconfig['scenario']
dropnum = allconfig['drop_num']
MCS = allconfig['mcs']
ssinfo = allconfig['scenario_info']
roledict = allconfig['usecase']
#printconfig()

for control in Controllist:
	controldict = {}
	controldict[control] = {}
	dropdict = {}
	pn(control)
	for drop in range(1,dropnum + 1):
		p(drop)
		dict =  collections.defaultdict(lambda:collections.defaultdict(float))
		drop = str(drop).zfill(2)
		droplabel = 'drop' + drop
		getpos()
		getdest()
		getstime()
		gettraf()
		getstat()
		getphystat()
		getretry()
		gettime()
		assignrole()
		getmcs()
		dropdict[droplabel] = dict
	controldict[control][ss] = dropdict
	pn('')
	round_dict()

	with open('./jsonFiles/extract_json_'+ ss + '_'+ control +'.json', 'w') as ex:
		ex.write(json.dumps(controldict,indent=4))
		round_dict()


pn('Finish!')