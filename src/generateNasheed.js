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
import faslonArab from './nasheeds/faslon_arb.txt'
import faslonEng from './nasheeds/faslon_eng.txt'
import faslonRom from './nasheeds/faslon_rom.txt'
import iduArab from './nasheeds/idu_arb.txt'
import iduEng from './nasheeds/idu_eng.txt'
import iduRom from './nasheeds/idu_rom.txt'

let urls = [
araftuArab, araftuEng, araftuRom, assubhuArab, assubhuEng, assubhuRom, bihayathbutArab, bihayathbutEng, bihayathbutRom,
faslonArab,faslonEng,faslonRom, iduArab, iduEng, iduRom, ishrabArab, ishrabEng, ishrabRom, lamyatiArab, lamyatiEng, lamyatiRom, 
hamdArab, hamdEng, hamdRom, madadArab, madadEng, madadRom, qadkafaniArab, qadkafaniEng, qadkafaniRom, burdahArab, burdahEng, burdahRom,
muhammadiyaArab, muhammadiyaEng, muhammadiyaRom, salaamArab, salaamEng, salaamRom, badrArab, badrEng, badrRom,
salliyasalaamArab, salliyasalaamEng, salliyasalaamRom, talalArab, talalEng, talalRom, talamaArab, talamaEng, talamaRom,
yaalimanArab, yaalimanEng, yaalimanRom, ya_hadiyArab, ya_hadiyEng, ya_hadiyRom, ya_hananaArab, ya_hananaEng, ya_hananaRom,
yanabiArab, yanabiEng, yanabiRom, yarabbiArab, yarabbiEng, yarabbiRom
]
let newUrls = [];
for (let i = 0; i < urls.length; i+=3){
	newUrls.push([urls[i],urls[i+1],urls[i+2]])
}

 export const generateNasheed = async () => {
	let nasheed = [];
		await Promise.all(newUrls.map(async (nash, index) =>{
				await fetch(nash[0]).then((response) => response.text())
					.then((result) => {
						const linesArr = result.split("\n")
						nasheed[index] = {arabTitle: linesArr[0]}
						nasheed[index].arab = linesArr.slice(1)});
				await fetch(nash[1]).then((response) => response.text())
					.then((result) => {
						const linesArr = result.split("\n")
						nasheed[index].eng = linesArr});
				await fetch(nash[2]).then((response) => response.text())
					.then((result) => {
						const linesArr = result.split("\n")
						nasheed[index].engTitle = linesArr[0]
						nasheed[index].rom = linesArr.slice(1)});
				}
			)
		)
	return {nasheed}
}