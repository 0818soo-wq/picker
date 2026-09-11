// 참석자 명단 (부서명\t직책\t성명\t참석여부(1=참석,0=불참예정))
// 관리자가 제공한 원본 명단을 그대로 붙여넣어 두고 파싱합니다.
const RAW = `
\t대표이사\t홍원학\t1\t
\t본부장\t박해관\t1\tFC영업
\t본부장\t오성용\t1\t전략영업
\t본부장\t최정훈\t1\t플랫폼
\t부문장\t최창희\t1\t자산운용부문
\t실장\t송상진\t1\tCPC전략실
\t실장\t이상희\t1\t기획실
\t실장\t이완삼\t1\t경영지원실
\t센터장\t이팔훈\t1\tAX/PI센터
\t실장\t조신형\t1\t소비자보호실
\t팀장\t안덕호\t1\t법무팀
\t팀장\t송준규\t1\tFC지원팀
\t팀장\t황동조\t1\t교육육성팀
\t사업부장\t정용성\t1\t수도권1사업부
\t사업부장\t범진관\t1\t수도권2사업부
\t사업부장\t모정혜\t1\t동부사업부
\t사업부장\t정명훈\t1\t서부사업부
\t팀장\t박훈민\t1\t전략영업지원팀
\t사업부장\t김규현\t1\tGFC사업부
\t사업부장\t하걸희\t1\tGA사업부
\t대표이사\t김진호\t1\t삼성금융서비스
\t사업부장\t김지은\t1\t디지털사업부
\t사업부장\t김봉재\t1\t헬스케어사업부
\t사업부장\t오상택\t1\t시니어사업부
\t담당임원\t김정은\t1\t시니어사업부
\t팀장\t김혜진\t1\t자산운용전략팀
\t팀장\t유승협\t1\t재무심사팀
\t팀장\t이인우\t0\t
\t사업부장\t고윤상\t1\t전략투자사업부
\t사업부장\t김현환\t1\t금융사업부
\t사업부장\t이상헌\t1\t특별계정사업부
\t사업부장\t이호선\t1\t연금1사업부
\t사업부장\t이지애\t1\t연금2사업부
\t사업부장\t장정수\t1\t연금3사업부
\t팀장\t허정무\t1\t채널마케팅팀
\t팀장\t권영임\t1\tCSM전략팀
\t팀장\t최창환\t1\t상품1팀
\t팀장\t김원\t1\t신계약팀
\t팀장\t장재순\t1\t보험금심사팀
\t팀장\t구철환\t1\t상품2팀
\t고문\t김용은\t1\t보험금심사팀
\t팀장\t이동욱\t1\t기획팀
\t팀장\t허정식\t1\t정책지원팀
\t팀장\t안철현\t1\t커뮤니케이션팀
\t팀장\t손익준\t1\tAX기획팀
\t팀장\t양경용\t1\tAX추진팀
\t팀장\t김진형\t1\tPI팀
\t팀장\t김성철\t1\t데이터거버넌스팀
\t팀장\t원창희\t1\t경영지원팀
\t팀장\t우무철\t1\t재경팀
\t팀장\t김용권\t1\tIR팀
\t팀장\t변인철\t1\t계리팀
\t팀장\t이지선\t1\tRM팀
\t팀장\t김선진\t1\t소비자보호팀
\t팀장\t황은아\t1\t컴플라이언스팀
\t팀장\t이성녕\t1\t인사팀
\tCISO\t권웅원\t1\t인사팀
\t팀장\t진형남\t1\t경영진단팀
영업지원P\t파트장\t이기웅\t0\t
영업추진P\t파트장\t이문섭\t1\tFC지원팀
리크루팅추진P\t파트장\t문용섭\t1\tFC지원팀
조직육성P\t파트장\t채호성\t1\t교육육성팀
교육지원P\t파트장\t김미정\t1\t교육육성팀
컨설팅P\t파트장\t조가현\t1\t교육육성팀
조직순증P\t파트장\t오종철\t1\t교육육성팀
휴먼센터지원P\t파트장\t문준영\t1\t교육육성팀
전주연수소지원P\t파트장\t김태엽\t1\t교육육성팀
해운대연수소지원P\t파트장\t김형준\t1\t교육육성팀
글로벌영업단\t지역단장\t이기열\t1\t교육육성팀
효율추진P\t파트장\t차원철\t1\t고객효율팀
고객활동P\t파트장\t유인선\t1\t고객효율팀
수도권1영업추진P\t파트장\t유훈\t1\t수도권1사업부
수도권1CSM지원P\t파트장\t주양식\t1\t수도권1사업부
수도권2영업추진P\t파트장\t박강노\t1\t수도권2사업부
수도권2CSM지원P\t파트장\t김영택\t1\t수도권2사업부
동부영업추진P\t파트장\t이승후\t1\t동부사업부
동부CSM지원P\t파트장\t박수용\t1\t동부사업부
대구권지원P\t파트장\t엄태홍\t1\t동부사업부
서부영업추진P\t파트장\t김덕윤\t1\t서부사업부
서부CSM지원P\t파트장\t김현석\t1\t서부사업부
충청권지원P\t파트장\t최용훈\t1\t서부사업부
강남FP센터\t파트장\t홍동우\t1\t수도권1사업부
경원FP센터\t파트장\t이승민\t1\t수도권1사업부
강남지역단\t지역단장\t신종훈\t1\t수도권1사업부
서초지역단\t지역단장\t황경석\t1\t수도권1사업부
방배지역단\t지역단장\t하경란\t1\t수도권1사업부
강동지역단\t지역단장\t김용철\t1\t수도권1사업부
송파지역단\t지역단장\t이승열\t1\t수도권1사업부
목동지역단\t지역단장\t최문규\t1\t수도권1사업부
강서지역단\t지역단장\t이범식\t1\t수도권1사업부
금천광명지역단\t지역단장\t이창신\t1\t수도권1사업부
여의도지역단\t지역단장\t박성주\t1\t수도권1사업부
WM지역단\t지역단장\t김필수\t1\t수도권1사업부
안양평촌지역단\t지역단장\t최재호\t1\t수도권1사업부
수원지역단\t지역단장\t유창효\t1\t수도권1사업부
경기지역단\t지역단장\t박양수\t1\t수도권1사업부
동탄오산지역단\t지역단장\t김장우\t1\t수도권1사업부
평택지역단\t지역단장\t유영민\t1\t수도권1사업부
분당지역단\t지역단장\t이태형\t1\t수도권1사업부
판교성남지역단\t지역단장\t허원영\t1\t수도권1사업부
광주이천지역단\t지역단장\t서대익\t1\t수도권1사업부
춘천원주지역단\t지역단장\t박성우\t1\t수도권1사업부
관동지역단\t지역단장\t김양진\t1\t수도권1사업부
서울FP센터\t파트장\t김동욱\t1\t수도권2사업부
경인FP센터\t파트장\t이원철\t1\t수도권2사업부
서울지역단\t지역단장\t강종우\t1\t수도권2사업부
은평지역단\t지역단장\t조영덕\t1\t수도권2사업부
신촌지역단\t지역단장\t조희승\t1\t수도권2사업부
일산지역단\t지역단장\t황진택\t1\t수도권2사업부
광진지역단\t지역단장\t조이화\t1\t수도권2사업부
구리지역단\t지역단장\t최준호\t1\t수도권2사업부
동대문지역단\t지역단장\t김철홍\t1\t수도권2사업부
강북지역단\t지역단장\t김신혁\t1\t수도권2사업부
노원지역단\t지역단장\t최정화\t1\t수도권2사업부
의정부지역단\t지역단장\t김진우\t1\t수도권2사업부
안산지역단\t지역단장\t이현진\t1\t수도권2사업부
부천지역단\t지역단장\t양진석\t1\t수도권2사업부
중동지역단\t지역단장\t강세훈\t1\t수도권2사업부
부평지역단\t지역단장\t김수종\t1\t수도권2사업부
계양지역단\t지역단장\t권영범\t1\t수도권2사업부
남동지역단\t지역단장\t이장열\t1\t수도권2사업부
인천지역단\t지역단장\t권희열\t1\t수도권2사업부
부산FP센터\t파트장\t김은아\t1\t동부사업부
대구FP센터\t파트장\t김연창\t1\t동부사업부
울산지역단\t지역단장\t윤호성\t1\t동부사업부
구포양산지역단\t지역단장\t강기원\t1\t동부사업부
김해지역단\t지역단장\t노영록\t1\t동부사업부
창원지역단\t지역단장\t장민제\t1\t동부사업부
마산지역단\t지역단장\t김태욱\t1\t동부사업부
금정지역단\t지역단장\t김승진\t1\t동부사업부
해운대지역단\t지역단장\t배철용\t1\t동부사업부
서면지역단\t지역단장\t곽민석\t1\t동부사업부
부산지역단\t지역단장\t김시훈\t1\t동부사업부
진주지역단\t지역단장\t성태갑\t1\t동부사업부
거제통영지역단\t지역단장\t김홍배\t1\t동부사업부
대구지역단\t지역단장\t손준식\t1\t동부사업부
달서지역단\t지역단장\t정영락\t1\t동부사업부
서대구지역단\t지역단장\t이수창\t1\t동부사업부
포항경주지역단\t지역단장\t김동민\t1\t동부사업부
구미지역단\t지역단장\t차한신\t1\t동부사업부
경북북부지역단\t지역단장\t김대인\t1\t동부사업부
호남FP센터\t파트장\t최대영\t1\t서부사업부
충청FP센터\t파트장\t류호선\t1\t서부사업부
대전지역단\t지역단장\t박화주\t1\t서부사업부
세종공주지역단\t지역단장\t장홍석\t1\t서부사업부
대전중부지역단\t지역단장\t신명훈\t1\t서부사업부
청주지역단\t지역단장\t신미진\t1\t서부사업부
충주지역단\t지역단장\t김동욱\t1\t서부사업부
충남중부지역단\t지역단장\t권혁진\t1\t서부사업부
충남서부지역단\t지역단장\t이태희\t1\t서부사업부
천안아산지역단\t지역단장\t장웅수\t1\t서부사업부
상무지역단\t지역단장\t유경록\t1\t서부사업부
광주지역단\t지역단장\t이종현\t1\t서부사업부
순천지역단\t지역단장\t송상형\t1\t서부사업부
여수지역단\t지역단장\t조세현\t1\t서부사업부
목포지역단\t지역단장\t배도영\t1\t서부사업부
동전주지역단\t지역단장\t김태승\t1\t서부사업부
전주지역단\t지역단장\t양광모\t1\t서부사업부
익산군산지역단\t지역단장\t양창윤\t1\t서부사업부
제주지역단\t지역단장\t김도영\t1\t서부사업부
영업지원P\t파트장\t박채원\t1\t전략영업지원팀
영업추진P\t파트장\t이경민\t1\t전략영업지원팀
CSM지원P\t파트장\t김형준\t1\t전략영업지원팀
GFC영업추진P\t파트장\t천규철\t1\tGFC사업부
GFC조직육성P\t파트장\t이영우\t1\tGFC사업부
GFC성장지원P\t파트장\t유진수\t1\tGFC사업부
서울법인지역단\t지역단장\t황재용\t1\tGFC사업부
서울법인지역단\t지원파트장\t김승현\t1\tGFC사업부
삼성법인지역단\t지역단장\t김승철\t1\tGFC사업부
강남법인지역단\t지역단장\t박시영\t1\tGFC사업부
서초법인지역단\t지역단장\t강전봉\t1\tGFC사업부
경인법인지역단\t지역단장\t최병선\t1\tGFC사업부
경기법인지역단\t지역단장\t장승호\t1\tGFC사업부
충청법인지역단\t지역단장\t김정민\t1\tGFC사업부
부산법인지역단\t지역단장\t김국련\t1\tGFC사업부
대구법인지역단\t지역단장\t윤익진\t1\tGFC사업부
호남법인지역단\t지역단장\t이동필\t1\tGFC사업부
SFP서울지역단\t지역단장\t이순규\t1\tGFC사업부
SFP부산지역단\t지역단장\t박상준\t1\tGFC사업부
GA영업지원P\t파트장\t최원석\t1\tGA사업부
GA영업추진P\t파트장\t김부건\t1\tGA사업부
GA컨설팅P\t파트장\t박종훈\t1\tGA사업부
GA서울지역단\t지역단장\t구광범\t1\tGA사업부
GA강북지역단\t지역단장\t이장원\t1\tGA사업부
GA강남지역단\t지역단장\t주용성\t0\t
GA경인지역단\t지역단장\t김상철\t1\tGA사업부
GA경원지역단\t지역단장\t김진호\t1\tGA사업부
GA충청지역단\t지역단장\t박대곤\t1\tGA사업부
GA부산지역단\t지역단장\t이재인\t1\tGA사업부
GA대구지역단\t지역단장\t김동진\t1\tGA사업부
GA호남지역단\t지역단장\t허승호\t0\t
GA경남지역단\t지역단장\t정명일\t1\tGA사업부
강북금융지역단\t지역단장\t강성창\t1\tGA사업부
강남금융지역단\t지역단장\t안영민\t1\tGA사업부
동부금융지역단\t지역단장\t진현욱\t1\tGA사업부
신채널사업단\t지역단장\t이민록\t1\t신채널사업단
신채널사업단\t지원파트장\t주영하\t1\t신채널사업단
AFC영업단\t지역단장\t이현범\t1\tAFC영업단
\t사업단장\t박종민\t1\t삼성금융서비스
\t파트장\t김영준\t1\t삼성금융서비스
디지털사업지원P\t파트장\t신동원\t0\t
플랫폼기획P\t파트장\t이가희\t1\t디지털사업부
플랫폼개발P\t파트장\t진은정\t1\t디지털사업부
디지털영업부\t영업부장\t조상규\t1\t디지털사업부
헬스케어기획P\t파트장\t김정주\t1\t헬스케어사업부
헬스케어Biz파트\t파트장\t김지만\t1\t헬스케어사업부
시니어사업추진P\t파트장\t진호정\t1\t시니어사업부
BA영업추진P\t파트장\t정기원\t1\t금융사업부
BA강남지역단\t지역단장\t김철규\t1\t금융사업부
BA강북지역단\t지역단장\t이건희\t1\t금융사업부
BA경인지역단\t지역단장\t김도윤\t1\t금융사업부
BA영남지역단\t지역단장\t이치영\t1\t금융사업부
BA서부지역단\t지역단장\t신상영\t1\t금융사업부
채널기획P\t파트장\t진혁\t1\t채널마케팅팀
채널지원P\t파트장\t김학수\t1\t채널마케팅팀
채널제도P\t파트장\t김경선\t1\t채널마케팅팀
마케팅P\t파트장\t신윤석\t1\t채널마케팅팀
WM지원P\t파트장\t송칠식\t1\t채널마케팅팀
투자상품지원P\t파트장\t김희안\t1\t채널마케팅팀
신탁부\t부장\t김재구\t1\t채널마케팅팀
패밀리오피스센터\t파트장\t황봉구\t1\t채널마케팅팀
채널혁신T/F\tT/F장\t노석준\t1\t채널마케팅팀
라이프트러스트센터\t센터장\t양진영\t1\t채널마케팅팀
효율전략P\t파트장\t윤종호\t1\tCSM전략팀
보유계약기획P\t파트장\t오정석\t1\tCSM전략팀
보전P\t파트장\t최희철\t1\tCSM전략팀
지급P\t파트장\t신현욱\t1\tCSM전략팀
고객전략P\t파트장\t이상우\t1\tCSM전략팀
고객경험혁신P\t파트장\t여세종\t1\tCSM전략팀
상품기획P\t파트장\t한원진\t1\t상품1팀
건강상품1P\t파트장\t김태훈\t1\t상품1팀
건강상품2P\t파트장\t정승영\t1\t상품1팀
상품지원P\t파트장\t김수은\t1\t상품1팀
상품Pricing파트\t파트장\t오홍석\t1\t상품1팀
상품인프라P\t파트장\t김민지\t1\t상품1팀
재보험P\t파트장\t한영미\t1\t상품2팀
상품손익P\t파트장\t김상범\t1\t상품2팀
종신연금상품P\t파트장\t한형규\t1\t상품2팀
혁신상품P\t파트장\t정애리\t1\t상품2팀
신계약기획P\t파트장\t김경돈\t1\t신계약팀
신계약지원P\t파트장\t신정균\t1\t신계약팀
신계약심사P\t파트장\t조성문\t1\t신계약팀
단체신계약P\t파트장\t정혜인\t1\t신계약팀
생활금융사업P\t파트장\t강보철\t1\t신계약팀
지급률T/F\tT/F장\t이지영\t1\t신계약팀
보험금심사지원P\t파트장\t이나연\t1\t보험금심사팀
보험금심사P\t파트장\t김병태\t1\t보험금심사팀
보험금품질관리P\t파트장\t박상일\t1\t보험금심사팀
보험금인프라P\t파트장\t이두희\t1\t보험금심사팀
SIU파트\t파트장\t송용주\t1\t보험금심사팀
전사기획P\t파트장\t강지웅\t1\t기획팀
AX전략P\t파트장\t서재원\t1\tAX/PI센터
AX시너지P\t파트장\t지경윤\t1\tAX/PI센터
AX플랫폼P\t파트장\t허은미\t1\tAX/PI센터
AX기획P\t파트장\t한누리\t1\tAX기획팀
코어AX파트\t파트장\t송기명\t1\tAX기획팀
영업AX파트\t파트장\t구자학\t1\tAX추진팀
영업플랫폼P\t파트장\t김여진\t1\tAX추진팀
PI파트\t파트장\t원창우\t1\tPI팀
데이터플랫폼P\t파트장\t이상훈\t1\t데이터거버넌스팀
데이터표준화P\t파트장\t홍내리\t1\t데이터거버넌스팀
경영관리P\t파트장\t이성훈\t1\t경영지원팀
재무관리P\t파트장\t심종용\t0\t
IFRS손익관리P\t파트장\t서유남\t1\t경영지원팀
회계P\t파트장\t장정민\t1\t재경팀
보험RM파트\t파트장\t강원재\t1\tRM팀
IT기획P\t파트장\t나병권\t1\t정보전략팀
인사운영P\t파트장\t김재훈\t1\t인사팀
신문화P\t파트장\t박인용\t1\t인사팀
총무P\t파트장\t이기현\t1\t인사팀
노동조합\t위원장\t박준형\t1\t노동조합
강서지역단 목동지점\t수석부위원장\t박민우\t1\t노동조합
보험금심사팀 보험금품질관리P\t부위원장\t김영동\t1\t노동조합
노동조합\t여성부위원장\t한현진\t1\t노동조합
`;

export type Attendee = {
  department: string;
  title: string;
  name: string;
  attending: boolean;
  // 상위 조직(본부/실/사업부 등)입니다. 화면 표시용으로만 쓰이고, 접수 저장이나
  // 동일인 판별에는 영향을 주지 않도록 department와 분리해서 관리합니다.
  team: string;
};

export const ATTENDEES: Attendee[] = RAW.trim()
  .split("\n")
  .map((line) => line.split("\t"))
  .filter((cols) => cols.length >= 4)
  .map(([department, title, name, attending, team]) => ({
    department: department.trim(),
    title: title.trim(),
    name: name.trim(),
    attending: attending.trim() === "1",
    team: (team ?? "").trim(),
  }));

// 화면에 소속을 보여줄 때, 상위 조직(team)과 부서명(department)이 다르면 함께
// 보여주고, 같거나 team이 없으면 department만 보여줍니다(예: "노동조합 노동조합"
// 처럼 중복 표시되지 않도록).
export function displayDepartment(team: string, department: string): string {
  if (team && team !== department) {
    return department ? `${team} ${department}` : team;
  }
  return department;
}

const LEADER_TITLES = new Set(["지역단장", "사업단장"]);
const PART_LEADER_TITLES = new Set(["파트장", "지원파트장"]);

export function isDrawEligibleTitle(title: string): boolean {
  return LEADER_TITLES.has(title) || PART_LEADER_TITLES.has(title);
}

// 접수 링크를 하나로 합친 뒤, 사번으로 조회한 실제 직책(명단 기준)만으로
// 추첨 대상 여부를 판단하기 위한 함수입니다. 지역단장/사업단장만 추첨
// 대상이며, 파트장/지원파트장을 포함한 그 외 직책은 의견 제출만 가능합니다.
export function isLeaderTitle(title: string): boolean {
  return LEADER_TITLES.has(title);
}

// 확정된 추첨대상 명단 기준으로, 직책은 지역단장/사업단장이 아니지만 예외적으로
// 추첨 대상에 포함되는 인원(FP센터 파트장, 일부 지원파트장)입니다.
const EXTRA_DRAW_ELIGIBLE: { department: string; name: string }[] = [
  { department: "강남FP센터", name: "홍동우" },
  { department: "경원FP센터", name: "이승민" },
  { department: "서울FP센터", name: "김동욱" },
  { department: "경인FP센터", name: "이원철" },
  { department: "부산FP센터", name: "김은아" },
  { department: "대구FP센터", name: "김연창" },
  { department: "호남FP센터", name: "최대영" },
  { department: "충청FP센터", name: "류호선" },
  { department: "서울법인지역단", name: "김승현" },
  { department: "신채널사업단", name: "주영하" },
];
const EXTRA_DRAW_ELIGIBLE_KEYS = new Set(
  EXTRA_DRAW_ELIGIBLE.map((e) => `${e.department}::${e.name}`)
);

// 확정된 추첨대상 명단에서 제외하기로 한 인원입니다. 직책상으로는 지역단장/
// 사업단장이어도 이 목록에 있으면 추첨 대상에서 빠집니다.
const DRAW_EXCLUDED: { department: string; name: string }[] = [{ department: "", name: "박종민" }];
const DRAW_EXCLUDED_KEYS = new Set(DRAW_EXCLUDED.map((e) => `${e.department}::${e.name}`));

// 실제 추첨(draw) 대상 여부를 최종적으로 판단하는 함수입니다. 접수 저장(entries/route.ts)과
// 내 접수 내용 조회(entries/mine/route.ts)에서 이 함수 하나로만 판단해야, 두 곳의 기준이
// 어긋나 "접수할 땐 추첨 대상이었는데 수정하려니 아니라고 나오는" 것 같은 불일치가 생기지 않습니다.
export function isDrawEligibleAttendee(attendee: Attendee): boolean {
  const key = `${attendee.department}::${attendee.name}`;
  if (DRAW_EXCLUDED_KEYS.has(key)) return false;
  return isLeaderTitle(attendee.title) || EXTRA_DRAW_ELIGIBLE_KEYS.has(key);
}

export function findAttendeeByName(name: string): Attendee | undefined {
  const cleaned = name.trim();
  const candidates = ATTENDEES.filter((a) => a.name === cleaned);
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];
  // 동명이인이 있을 경우, 추첨 대상 직책(지역단장/파트장 등)을 우선합니다.
  return candidates.find((a) => isDrawEligibleTitle(a.title)) ?? candidates[0];
}

// 이름만으로는 동명이인을 구분할 수 없을 때, 부서명까지 함께 확인해 정확한
// 한 명을 찾습니다. (employeeDirectory.ts에서 사번에 부서명이 함께 기록된
// 경우 사용)
export function findAttendeeByNameAndDepartment(name: string, department: string): Attendee | undefined {
  const cleanedName = name.trim();
  const cleanedDept = department.trim();
  return ATTENDEES.find((a) => a.name === cleanedName && a.department === cleanedDept);
}

export function titleSuffixFor(title: string): "단장님" | "파트장님" {
  return PART_LEADER_TITLES.has(title) ? "파트장님" : "단장님";
}

const REGION_DEPARTMENT_SUFFIXES = ["지역단", "영업단", "사업단", "FP센터"];

// 지역단/영업단/사업단/FP센터 소속(지역 조직)과 그 외 본사 스텝을 구분합니다.
export function classifyAttendeeGroup(attendee: Attendee): "region" | "hq" {
  return REGION_DEPARTMENT_SUFFIXES.some((suffix) => attendee.department.endsWith(suffix))
    ? "region"
    : "hq";
}
