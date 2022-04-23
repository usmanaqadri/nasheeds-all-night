import badrArab from './nasheeds/salatul_badriyya_arb.txt'
import badrEng from './nasheeds/salatul_badriyya_eng.txt'
import badrRom from './nasheeds/salatul_badriyya_rom.txt'
import talamaArab from './nasheeds/talama_arb.txt'
import talamaEng from './nasheeds/talama_eng.txt'
import talamaRom from './nasheeds/talama_rom.txt'
import muhammadiyaArab from './nasheeds/muhammadiya_arb.txt'
import muhammadiyaEng from './nasheeds/muhammadiya_eng.txt'
import muhammadiyaRom from './nasheeds/muhammadiya_rom.txt'
import burdahArab from './nasheeds/burdah_arb.txt'
import burdahEng from './nasheeds/burdah_eng.txt'
import burdahRom from './nasheeds/burdah_rom.txt'
import ya_hadiyArab from './nasheeds/ya-hadiy_arb.txt'
import ya_hadiyEng from './nasheeds/ya-hadiy_eng.txt'
import ya_hadiyRom from './nasheeds/ya-hadiy_rom.txt'
import ishrabArab from './nasheeds/ishrab_arb.txt'
import ishrabEng from './nasheeds/ishrab_eng.txt'
import ishrabRom from './nasheeds/ishrab_rom.txt'
import ya_hananaArab from './nasheeds/ya-hanana_arb.txt'
import ya_hananaEng from './nasheeds/ya-hanana_eng.txt'
import ya_hananaRom from './nasheeds/ya-hanana_rom.txt'
import talalArab from './nasheeds/talal_arb.txt'
import talalEng from './nasheeds/talal_eng.txt'
import talalRom from './nasheeds/talal_rom.txt'
import hamdArab from './nasheeds/hamd_arb.txt'
import hamdEng from './nasheeds/hamd_eng.txt'
import hamdRom from './nasheeds/hamd_rom.txt'
import lamyatiArab from './nasheeds/lamyati_arb.txt'
import lamyatiEng from './nasheeds/lamyati_eng.txt'
import lamyatiRom from './nasheeds/lamyati_rom.txt'
import qadkafaniArab from './nasheeds/qadkafani_arb.txt'
import qadkafaniEng from './nasheeds/qadkafani_eng.txt'
import qadkafaniRom from './nasheeds/qadkafani_rom.txt'
import yaalimanArab from './nasheeds/yaaliman_arb.txt'
import yaalimanEng from './nasheeds/yaaliman_eng.txt'
import yaalimanRom from './nasheeds/yaaliman_rom.txt'
import salliyasalaamArab from './nasheeds/salliyasalaam_arb.txt'
import salliyasalaamEng from './nasheeds/salliyasalaam_eng.txt'
import salliyasalaamRom from './nasheeds/salliyasalaam_rom.txt'
import araftuArab from './nasheeds/araftu_arb.txt'
import araftuEng from './nasheeds/araftu_eng.txt'
import araftuRom from './nasheeds/araftu_rom.txt'
import salaamArab from './nasheeds/salaam_arb.txt'
import salaamEng from './nasheeds/salaam_eng.txt'
import salaamRom from './nasheeds/salaam_rom.txt'
import assubhuArab from './nasheeds/assubhu_arb.txt'
import assubhuEng from './nasheeds/assubhu_eng.txt'
import assubhuRom from './nasheeds/assubhu_rom.txt'
import bihayathbutArab from './nasheeds/bihayathbut_arb.txt'
import bihayathbutEng from './nasheeds/bihayathbut_eng.txt'
import bihayathbutRom from './nasheeds/bihayathbut_rom.txt'
import madadArab from './nasheeds/madad_arb.txt'
import madadEng from './nasheeds/madad_eng.txt'
import madadRom from './nasheeds/madad_rom.txt'
import yanabiArab from './nasheeds/yanabi_arb.txt'
import yanabiEng from './nasheeds/yanabi_eng.txt'
import yanabiRom from './nasheeds/yanabi_rom.txt'
import yarabbiArab from './nasheeds/yarabbi_arb.txt'
import yarabbiEng from './nasheeds/yarabbi_eng.txt'
import yarabbiRom from './nasheeds/yarabbi_rom.txt'



 export const generateNasheed = async () => {
	let nasheed = [];
		await Promise.all([
			fetch(badrArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[0].arab = linesArr.slice(1)}),
			fetch(badrEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[0].eng = linesArr}),
			fetch(badrRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[0].engTitle = linesArr[0]
					nasheed[0].rom = linesArr.slice(1)}),
			fetch(talamaArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[1].arab = linesArr.slice(1)}),
			fetch(talamaEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[1].eng = linesArr}),
			fetch(talamaRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[1].engTitle = linesArr[0]
					nasheed[1].rom = linesArr.slice(1)}),
			fetch(muhammadiyaArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[2].arab = linesArr.slice(1)}),
			fetch(muhammadiyaEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[2].eng = linesArr}),
			fetch(muhammadiyaRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[2].engTitle = linesArr[0]
					nasheed[2].rom = linesArr.slice(1)}),
			fetch(burdahArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[3].arab = linesArr.slice(1)}),
			fetch(burdahEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[3].eng = linesArr}),
			fetch(burdahRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[3].engTitle = linesArr[0]
					nasheed[3].rom = linesArr.slice(1)}),
			fetch(ya_hadiyArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[4].arab = linesArr.slice(1)}),
			fetch(ya_hadiyEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[4].eng = linesArr}),
			fetch(ya_hadiyRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[4].engTitle = linesArr[0]
					nasheed[4].rom = linesArr.slice(1)}),
			fetch(ishrabArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[5].arab = linesArr.slice(1)}),
			fetch(ishrabEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[5].eng = linesArr}),
			fetch(ishrabRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[5].engTitle = linesArr[0]
					nasheed[5].rom = linesArr.slice(1)}),
			fetch(ya_hananaArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[6].arab = linesArr.slice(1)}),
			fetch(ya_hananaEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[6].eng = linesArr}),
			fetch(ya_hananaRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[6].engTitle = linesArr[0]
					nasheed[6].rom = linesArr.slice(1)}),
			fetch(talalArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[7].arab = linesArr.slice(1)}),
			fetch(talalEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[7].eng = linesArr}),
			fetch(talalRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[7].engTitle = linesArr[0]
					nasheed[7].rom = linesArr.slice(1)}),
			fetch(hamdArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[8].arab = linesArr.slice(1)}),
			fetch(hamdEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[8].eng = linesArr}),
			fetch(hamdRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[8].engTitle = linesArr[0]
					nasheed[8].rom = linesArr.slice(1)}),
			fetch(lamyatiArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[9].arab = linesArr.slice(1)}),
			fetch(lamyatiEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[9].eng = linesArr}),
			fetch(lamyatiRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[9].engTitle = linesArr[0]
					nasheed[9].rom = linesArr.slice(1)}),
			fetch(qadkafaniArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[10].arab = linesArr.slice(1)}),
			fetch(qadkafaniEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[10].eng = linesArr}),
			fetch(qadkafaniRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[10].engTitle = linesArr[0]
					nasheed[10].rom = linesArr.slice(1)}),
			fetch(yaalimanArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[11].arab = linesArr.slice(1)}),
			fetch(yaalimanEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[11].eng = linesArr}),
			fetch(yaalimanRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[11].engTitle = linesArr[0]
					nasheed[11].rom = linesArr.slice(1)}),
			fetch(salliyasalaamArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[12].arab = linesArr.slice(1)}),
			fetch(salliyasalaamEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[12].eng = linesArr}),
			fetch(salliyasalaamRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[12].engTitle = linesArr[0]
					nasheed[12].rom = linesArr.slice(1)}),
			fetch(araftuArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[13].arab = linesArr.slice(1)}),
			fetch(araftuEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[13].eng = linesArr}),
			fetch(araftuRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[13].engTitle = linesArr[0]
					nasheed[13].rom = linesArr.slice(1)}),
			fetch(salaamArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[14].arab = linesArr.slice(1)}),
			fetch(salaamEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[14].eng = linesArr}),
			fetch(salaamRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[14].engTitle = linesArr[0]
					nasheed[14].rom = linesArr.slice(1)}),
			fetch(assubhuArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[15].arab = linesArr.slice(1)}),
			fetch(assubhuEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[15].eng = linesArr}),
			fetch(assubhuRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[15].engTitle = linesArr[0]
					nasheed[15].rom = linesArr.slice(1)}),
			fetch(bihayathbutArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[16].arab = linesArr.slice(1)}),
			fetch(bihayathbutEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[16].eng = linesArr}),
			fetch(bihayathbutRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[16].engTitle = linesArr[0]
					nasheed[16].rom = linesArr.slice(1)}),
			fetch(madadArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[17].arab = linesArr.slice(1)}),
			fetch(madadEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[17].eng = linesArr}),
			fetch(madadRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[17].engTitle = linesArr[0]
					nasheed[17].rom = linesArr.slice(1)}),
			fetch(yanabiArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[18].arab = linesArr.slice(1)}),
			fetch(yanabiEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[18].eng = linesArr}),
			fetch(yanabiRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[18].engTitle = linesArr[0]
					nasheed[18].rom = linesArr.slice(1)}),
			fetch(yarabbiArab).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed.push({arabTitle: linesArr[0]})
					nasheed[19].arab = linesArr.slice(1)}),
			fetch(yarabbiEng).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[19].eng = linesArr}),
			fetch(yarabbiRom).then((response) => response.text())
				.then((result) => {
					const linesArr = result.split("\n")
					nasheed[19].engTitle = linesArr[0]
					nasheed[19].rom = linesArr.slice(1)}),
		])
	return {nasheed}
}
