/**
 * Risco de câncer de mama invasivo: modelo de Gail, como na ferramenta BCRAT do National Cancer Institute
 * (bcrisktool.cancer.gov). Tabelas e regras do pacote R BCRA (CRAN), publicado pelo NCI.
 * Validação (28/10/2026): 66 casos aleatórios, todas as etnias, idênticos aos quatro números da BCRAT.
 */
const T: Record<string, number[]> = {
  White_lambda1: [0.00001000,0.00007600,0.00026600,0.00066100,0.00126500,0.00186600,0.00221100,0.00272100,0.00334800,0.00392300,0.00417800,0.00443900,0.00442100,0.00410900],
  White_lambda1Avg: [0.00001220,0.00007410,0.00022970,0.00056490,0.00116450,0.00195250,0.00261540,0.00302790,0.00367570,0.00420290,0.00473080,0.00494250,0.00479760,0.00401060],
  Black_lambda1: [0.00002696,0.00011295,0.00031094,0.00067639,0.00119444,0.00187394,0.00241504,0.00291112,0.00310127,0.00366560,0.00393132,0.00408951,0.00396793,0.00363712],
  Hspnc_lambda1: [0.0000166,0.0000741,0.0002740,0.0006099,0.0012225,0.0019027,0.0023142,0.0028357,0.0031144,0.0030794,0.0033344,0.0035082,0.0025308,0.0020414],
  Other_lambda1: [0.00001000,0.00007600,0.00026600,0.00066100,0.00126500,0.00186600,0.00221100,0.00272100,0.00334800,0.00392300,0.00417800,0.00443900,0.00442100,0.00410900],
  FHspnc_lambda1: [0.0000102,0.0000531,0.0001578,0.0003602,0.0007617,0.0011599,0.0014111,0.0017245,0.0020619,0.0023603,0.0025575,0.0028227,0.0028295,0.0025868],
  Chnes_lambda1: [0.000004059636,0.000045944465,0.000188279352,0.000492930493,0.000913603501,0.001471537353,0.001421275482,0.001970946494,0.001674745804,0.001821581075,0.001834477198,0.001919911972,0.002233371071,0.002247315779],
  Japns_lambda1: [0.000000000001,0.000099483924,0.000287041681,0.000545285759,0.001152211095,0.001859245108,0.002606291272,0.003221751682,0.004006961859,0.003521715275,0.003593038294,0.003589303081,0.003538507159,0.002051572909],
  Filip_lambda1: [0.000007500161,0.000081073945,0.000227492565,0.000549786433,0.001129400541,0.001813873795,0.002223665639,0.002680309266,0.002891219230,0.002534421279,0.002457159409,0.002286616920,0.001814802825,0.001750879130],
  Hawai_lambda1: [0.000045080582,0.000098570724,0.000339970860,0.000852591429,0.001668562761,0.002552703284,0.003321774046,0.005373001776,0.005237808549,0.005581732512,0.005677419355,0.006513409962,0.003889457523,0.002949061662],
  OtrPI_lambda1: [0.000000000001,0.000071525212,0.000288799028,0.000602250698,0.000755579402,0.000766406354,0.001893124938,0.002365580107,0.002843933070,0.002920921732,0.002330395655,0.002036291235,0.001482683983,0.001012248203],
  OtrAs_lambda1: [0.000012355409,0.000059526456,0.000184320831,0.000454677273,0.000791265338,0.001048462801,0.001372467817,0.001495473711,0.001646746198,0.001478363563,0.001216010125,0.001067663700,0.001376104012,0.000661576644],
  White_lambda2: [0.00049300,0.00053100,0.00062500,0.00082500,0.00130700,0.00218100,0.00365500,0.00585200,0.00943900,0.01502800,0.02383900,0.03883200,0.06682800,0.14490800],
  White_lambda2Avg: [0.00044120,0.00052540,0.00067460,0.00090920,0.00125340,0.00195700,0.00329840,0.00546220,0.00910350,0.01418540,0.02259350,0.03611460,0.06136260,0.14206630],
  Black_lambda2: [0.00074354,0.00101698,0.00145937,0.00215933,0.00315077,0.00448779,0.00632281,0.00963037,0.01471818,0.02116304,0.03266035,0.04564087,0.06835185,0.13271262],
  Hspnc_lambda2: [0.0003561,0.0004038,0.0005281,0.0008875,0.0013987,0.0020769,0.0030912,0.0046960,0.0076050,0.0120555,0.0193805,0.0288386,0.0429634,0.0740349],
  Other_lambda2: [0.00049300,0.00053100,0.00062500,0.00082500,0.00130700,0.00218100,0.00365500,0.00585200,0.00943900,0.01502800,0.02383900,0.03883200,0.06682800,0.14490800],
  FHspnc_lambda2: [0.0003129,0.0002908,0.0003515,0.0004943,0.0007807,0.0012840,0.0020325,0.0034533,0.0058674,0.0096888,0.0154429,0.0254675,0.0448037,0.1125678],
  Chnes_lambda2: [0.000210649076,0.000192644865,0.000244435215,0.000317895949,0.000473261994,0.000800271380,0.001217480226,0.002099836508,0.003436889186,0.006097405623,0.010664526765,0.020148678452,0.037990796590,0.098333900733],
  Japns_lambda2: [0.000173593803,0.000295805882,0.000228322534,0.000363242389,0.000590633044,0.001086079485,0.001859999966,0.003216600974,0.004719402141,0.008535331402,0.012433511681,0.020230197885,0.037725498348,0.106149118663],
  Filip_lambda2: [0.000229120979,0.000262988494,0.000314844090,0.000394471908,0.000647622610,0.001170202327,0.001809380379,0.002614170568,0.004483330681,0.007393665092,0.012233059675,0.021127058106,0.037936954809,0.085138518334],
  Hawai_lambda2: [0.000563507269,0.000369640217,0.001019912579,0.001234013911,0.002098344078,0.002982934175,0.005402445702,0.009591474245,0.016315472607,0.020152229069,0.027354838710,0.050446998723,0.072262026612,0.145844504021],
  OtrPI_lambda2: [0.000465500812,0.000600466920,0.000851057138,0.001478265376,0.001931486788,0.003866623959,0.004924932309,0.008177071806,0.008638202890,0.018974658371,0.029257567105,0.038408980974,0.052869579345,0.074745721133],
  OtrAs_lambda2: [0.000212632332,0.000242170741,0.000301552711,0.000369053354,0.000543002943,0.000893862331,0.001515172239,0.002574669551,0.004324370426,0.007419621918,0.013251765130,0.022291427490,0.041746550635,0.087485802065],
  White_1_AR: [0.5788413,0.5788413],
  Black_1_AR: [0.72949880,0.74397137],
  Hspnc_1_AR: [0.749294788397,0.778215491668],
  Other_1_AR: [0.5788413,0.5788413],
  FHspnc_1_AR: [0.428864989813,0.450352338746],
  Asian_1_AR: [0.47519806426735,0.50316401683903],
  White_Beta: [0.5292641686,0.0940103059,0.2186262218,0.9583027845,-0.2880424830,-0.1908113865],
  Black_Beta: [0.1822121131,0.2672530336,0.0,0.4757242578,-0.1119411682,0.0],
  Hspnc_Beta: [0.0970783641,0.0000000000,0.2318368334,0.166685441,0.0000000000,0.0000000000],
  FHspnc_Beta: [0.4798624017,0.2593922322,0.4669246218,0.9076679727,0.0000000000,0.0000000000],
  Other_Beta: [0.5292641686,0.0940103059,0.2186262218,0.9583027845,-0.2880424830,-0.1908113865],
  Asian_Beta: [0.55263612260619,0.07499257592975,0.27638268294593,0.79185633720481,0.0,0.0],
}

export type EtniaGail = 'White' | 'Black' | 'Hispanic' | 'Asian' | 'Other' | 'Unknown'
export type SubGail = '' | 'US Hispanic' | 'Foreign Hispanic' | 'Chinese' | 'Japanese' | 'Filipino' | 'Hawaiian' | 'Islander' | 'Asian'

export const ETNIAS_GAIL: Array<[EtniaGail, string]> = [
  ['White', 'Branca'], ['Black', 'Negra / afro-americana'], ['Hispanic', 'Hispânica / latina'],
  ['Asian', 'Asiática (inclui nativa havaiana)'], ['Other', 'Indígena americana ou nativa do Alasca'], ['Unknown', 'Não informada'],
]
export const SUBGRUPOS_GAIL: Partial<Record<EtniaGail, Array<[SubGail, string]>>> = {
  Hispanic: [['US Hispanic', 'Nascida nos EUA'], ['Foreign Hispanic', 'Nascida fora dos EUA']],
  Asian: [['Chinese', 'Chinesa'], ['Filipino', 'Filipina'], ['Hawaiian', 'Havaiana'], ['Islander', 'Ilhas do Pacífico'], ['Japanese', 'Japonesa'], ['Asian', 'Outra asiática']],
}

/** Respostas no formato da BCRAT. "Não sei" já vem convertido como na ferramenta oficial. */
export type EntradaGail = {
  idade: number
  etnia: EtniaGail; sub: SubGail
  biopsia: 0 | 1 | 99            // não, sim, não sei
  nBiopsias: 1 | 2               // 2 = duas ou mais
  atipia: 0.93 | 1 | 1.82        // não, não sei, sim
  menarca: 0 | 1 | 2             // 14+, 12 a 13, 7 a 11
  primeiroParto: 98 | 0 | 1 | 2 | 3 // sem filhos, <20 (ou não sei), 20-24, 25-29, 30+
  parentes: 0 | 1 | 2            // nenhum (ou não sei), um, mais de um
}
export type ResultadoGail = { cinco: number; cincoMedia: number; vida: number; vidaMedia: number }

const CODIGO: Record<string, number> = {
  White: 1, Black: 2, 'US Hispanic': 3, Other: 4, 'Foreign Hispanic': 5,
  Chinese: 6, Japanese: 7, Filipino: 8, Hawaiian: 9, Islander: 10, Asian: 11,
}
const L = ['White', 'Black', 'Hspnc', 'Other', 'FHspnc', 'Chnes', 'Japns', 'Filip', 'Hawai', 'OtrPI', 'OtrAs']
const AR = ['White', 'Black', 'Hspnc', 'Other', 'FHspnc', 'Asian', 'Asian', 'Asian', 'Asian', 'Asian', 'Asian']

type Modelo = { r: number; nb: number; am: number; af: number; nr: number; rhyp: number }

function recodificar(e: EntradaGail): Modelo {
  let raca: string = e.etnia === 'Unknown' ? 'Other' : e.etnia
  if (raca === 'Hispanic') raca = e.sub === 'Foreign Hispanic' ? 'Foreign Hispanic' : 'US Hispanic'
  if (raca === 'Asian') raca = e.sub || 'Asian'
  const r = CODIGO[raca]
  let nb = e.biopsia === 1 ? (e.nBiopsias >= 2 ? 2 : 1) : 0
  const rhyp = nb > 0 ? e.atipia : 1
  let am: number = e.menarca, af: number = e.primeiroParto === 98 ? 2 : e.primeiroParto, nr: number = e.parentes
  const semFilhos = e.primeiroParto === 98
  if (r === 2) { af = 0; if (am === 2) am = 1 }
  if (r === 3 || r === 5) { if (nb === 2) nb = 1; if (!semFilhos && af === 2) af = 1; if (af === 3) af = 2; if (nr === 2) nr = 1 }
  if (r === 3) am = 0
  if (r >= 6 && nr === 2) nr = 1
  return { r, nb, am, af, nr, rhyp }
}

function riscoRelativo(m: Modelo) {
  const b = T[AR[m.r - 1] + '_Beta']
  const lp1 = m.nb * b[0] + m.am * b[1] + m.af * b[2] + m.nr * b[3] + m.af * m.nr * b[5] + Math.log(m.rhyp)
  return [Math.exp(lp1), Math.exp(lp1 + m.nb * b[4])]
}

function absoluto(m: Modelo, t1: number, t2: number, media: boolean) {
  const i = m.r - 1
  let l1 = T[L[i] + '_lambda1'], l2 = T[L[i] + '_lambda2']
  const um = new Array<number>(70)
  if (!media) {
    const ar = T[AR[i] + '_1_AR'], [s1, s2] = riscoRelativo(m)
    um.fill(ar[0] * s1, 0, 30); um.fill(ar[1] * s2, 30, 70)
  } else {
    um.fill(1)
    if (m.r === 1 || m.r === 4) { l1 = T.White_lambda1Avg; l2 = T.White_lambda2Avg }
  }
  const inicio = Math.floor(t1) - 20, n = Math.ceil(t2) - Math.floor(t1)
  let risco = 0, acum = 0
  for (let j = 0; j < n; j++) {
    const k = inicio + j, a = l1[Math.floor(k / 5)], d = l2[Math.floor(k / 5)]
    const len = n === 1 ? t2 - t1 : j === 0 ? 1 - (t1 - Math.floor(t1)) : j === n - 1 ? (t2 > Math.floor(t2) ? t2 - Math.floor(t2) : 1) : 1
    const lam = a * um[k] + d
    risco += (um[k] * a / lam) * Math.exp(-acum) * (1 - Math.exp(-lam * len))
    acum += lam * len
  }
  return 100 * risco
}

const umaCasa = (x: number) => Math.round(x * 10) / 10

/** Percentuais com uma casa, como a BCRAT. Idade válida: 35 a 85. */
export function gail(e: EntradaGail): ResultadoGail {
  const m = recodificar(e)
  return {
    cinco: umaCasa(absoluto(m, e.idade, e.idade + 5, false)), cincoMedia: umaCasa(absoluto(m, e.idade, e.idade + 5, true)),
    vida: umaCasa(absoluto(m, e.idade, 90, false)), vidaMedia: umaCasa(absoluto(m, e.idade, 90, true)),
  }
}

/** Limiar de 5 anos usado nos EUA para discutir quimioprevenção. */
export const LIMIAR_GAIL_5 = 1.67
