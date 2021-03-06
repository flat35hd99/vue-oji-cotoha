/**
* HTTP function that supports CORS requests.
*
* @param {Object} req Cloud Function request context.
* @param {Object} res Cloud Function response context.
*/
const axios = require('axios')
exports.corsEnabledFunction = async (req, res) => {
 // Set CORS headers for preflight requests
 // Allows GETs from any origin with the Content-Type header
 // and caches preflight response for 3600s

 res.set('Access-Control-Allow-Origin', '*');

 if (req.method === 'OPTIONS') {
   // Send response to OPTIONS requests
   res.set('Access-Control-Allow-Methods', 'POST');
   res.set('Access-Control-Allow-Headers', 'Content-Type');
   res.set('Access-Control-Max-Age', '3600');
   res.status(204).send('');
 } else {
   await ojisanCompiler(req,res)
 }
};

class Cotoha{
  constructor(sentence,cotoha_token){
    this.sentence = sentence;
    this.cotoha_token = cotoha_token
    this.sentenceArr = []
    this.parseArr = ""
    this.analysisArr = []
  }
  client(){
    const axiosConfig = axios.create({
      headers:{
        "Authorization": `Bearer ${this.cotoha_token}`,
        "Content-Type": "application/json"
      },
      baseURL:"https://api.ce-cotoha.com/api/dev/nlp/v1",
    });
    return axiosConfig;
  }
  async parse(){
    const axiosBase = await this.client();
    try{
      const res = await axiosBase.post("/parse",{"sentence":this.sentence})
      //await fs.writeFile("./output/parse.json",JSON.stringify(res.data,null,"\t"));
      const result = res.data.result;
      this.parseArr = result
      return result
    }catch(e){
      return e
    }
  }
  sentiment(arg){
    return new Promise((resolve,reject)=>{
      const sentence = arg!=null ? arg : this.sentence
      const axiosBase = this.client();
      axiosBase.post("/sentiment",{"sentence":sentence}).then(res=>{
        const result = res.data.result
        //console.log(result)
        resolve(result)
      }).catch(e=>{
        reject(e)
      })
    })
  }
  async unique(arg){
    const sentence = arg != null ? arg : this.sentence
    const axiosBase = await this.client();
    try{
      const res = await axiosBase.post("/ne",{"sentence":sentence})
      //await fs.writeFile("./output/unique.json",JSON.stringify(res.data,null,"\t"));
      const result = res.data.result;
      //console.log(result)
      return result
    }catch(e){
      return e
    }
  }
  /*async similarity(s2){
    const axiosBase = await this.client();
    const res = await axiosBase.post("/similarity",{
      "s1":this.sentence,
      "s2":s2
    });
    //await fs.writeFile("./output/similarity.json",JSON.stringify(res.data,null,"\t"));
    return res.data;
  }*/
  async sentenceType(arg){
    const sentence = arg != null ? arg : this.sentence
    const axiosBase = await this.client();
    const res = await axiosBase.post("/sentence_type",{
      "sentence":sentence,
    });
    //await fs.writeFile("./output/sentenceType.json",JSON.stringify(res.data,null,"\t"));
    //console.log(res.data.result);
    return res.data.result;
  }
  async separateSentence () {
    //console.log("separateSentence start")
    const cutPoint = []
    const parseChunk = []
    this.parseArr.forEach((item, n) => {
      item.tokens.forEach((obj) => {
        //console.log(obj)
        if(obj.pos=="終助詞"){
          cutPoint.push(n)
          //console.log(n)
        }
      });
    });
    if(this.parseArr.length!=cutPoint.slice(-1)[0]){
      //cutPoint配列の最後の値がparseArrの長さと一致していないと、結果が途中で切れてしまう。
      cutPoint.push(this.parseArr.length)
    }

    //console.log(cutPoint)
    //console.log("separateSentence midium")
    //終助詞があるタイミングで配列を切り分けている。
    for (let i = 0; i < cutPoint.length; i++) {
      parseChunk[i] = []
      for (let n = cutPoint[i-1]==null ? 0 : cutPoint[i-1]+1; n < this.parseArr.length; n++) {
        //console.log("debug")
        //console.log("i : "+i)
        //console.log("n : "+n)
        parseChunk[i].push(this.parseArr[n])
        if(n==cutPoint[i]){
          break
        }

      }
    }

    //終助詞で切り分けられた平文の配列で戻す。
    parseChunk.forEach((chunkArr,n) => {
      let sentence = ""
      chunkArr.forEach((obj) => {
        obj.tokens.forEach((token) => {
          sentence = sentence + token.form
          //console.log(token.form)
        });
      });
      this.sentenceArr[n] = sentence
      //console.log(n + " : " + sentence)
    });
    //console.log("separateSentence end")
    return this.sentenceArr
  }
  async createAnalysis () {
    this.sentenceArr.forEach((text,i) => {
      const obj = {
        id: i,
        sentence : text,
        sentiment : {},
        unique : [],
        sentenceType : {}
      }
      this.analysisArr.push(obj)
    });

    const p1 = this.sentenceArr.map((text,i)=>{
      return new Promise((resolve,reject)=>{
        this.unique(text).then(obj=>{
          this.analysisArr[i].unique = obj
          resolve(1)
        }).catch(e=>{
          reject(e)
        })
      })
    })
    const p2 = this.sentenceArr.map((text,i)=>{
      return new Promise((resolve,reject)=>{
        this.sentenceType(text).then(obj=>{
          this.analysisArr[i].sentenceType = obj
          resolve(1)
        }).catch(e=>{
          reject(e)
        })
      })
    })
    await Promise.all(p1.concat(p2))
    return this.analysisArr
  }
  ShapedUniqueEmoji (sentence,uniqueArr) {
    const emojiObj = {
      "Name": "チャン",
      "Name_Other": "クン",
      "Person": "",
      "God": "",
      "Organization": "",
      "Organization_Other": "",
      "International_Organization": "&#x1f30d;",
      "Show_Organization": "&#x1f3aa;",
      "Family": "&#x1f468;",
      "Ethnic_Group": "",
      "Ethnic_Group_Other": "",
      "Nationality": "",
      "Sports_Organization": "&#x1f3df;",
      "Sports_Organization_Other": "&#x1f3df;",
      "Pro_Sports_Organization": "&#x1f3df;",
      "Sports_League": "&#x1f3df;",
      "Corporation": "&#x1f3e2;",
      "Corporation_Other": "&#x1f3e2;",
      "Company": "&#x1f3e2;",
      "Company_Group": "&#x1f3e2;",
      "Political_Organization": "&#x1f3e2;",
      "Political_Organization_Other": "&#x1f3e2;",
      "Government": "",
      "Political_Party": "",
      "Cabinet": "",
      "Military": "",
      "Location": "",
      "Location_Other": "",
      "Spa": "&#x2668;",
      "GPE": "&#x1f3d9;",
      "GPE_Other": "&#x1f3d9;",
      "City": "&#x1f3d9;",
      "County": "&#x1f3d9;",
      "Province": "&#x1f3d9;",
      "Country": "",
      "Region": "",
      "Region_Other": "",
      "Continental_Region": "&#x1f5fa;",
      "Domestic_Region": "&#x1f5fe;",
      "Geological_Region": "",
      "Geological_Region_Other": "",
      "Mountain": "&#x26f0;",
      "Island": "&#x1f3dd;",//2020/03/15 asd commit
      "River": "",
      "Lake": "",
      "Sea": "",
      "Bay": "",
      "Astral_Body": "&#x1f30d;",
      "Astral_Body_Other": "&#x1f30d;",
      "Star": "&#x2b50;",
      "Planet": "",
      "Constellation": "",
      "Address": "&#x1f4eb;",
      "Address_Other": "&#x1f4eb;",
      "Postal_Address": "",
      "Phone_Number": "&#x1f4f3;",
      "Email": "&#x1f4e7;",
      "URL": "",
      "Facility": "",
      "Facility_Other": "",
      "Facility_Part": "",
      "Archaeological_Place": "&#x1f3db;",
      "Archaeological_Place_Other": "&#x1f3db;",
      "Tumulus": "&#x1f3db;",
      "GOE": "",
      "GOE_Other": "",
      "Public_Institution": "",
      "School": "&#x1f3eb;",
      "Research_Institution": "",
      "Market": "",
      "Park": "",
      "Sports_Facility": "&#x1f3df;",
      "Museum": "",
      "Zoo": "",
      "Amusement_Park": "&#x1f3a1;",
      "Theater": "",
      "Worship_Place": "&#x26e9;",
      "Car_Stop": "&#x1f697;",
      "Station": "&#x1f683;",
      "Airport": "&#x2708;",
      "Port": "",
      "Line": "&#x1f683;",
      "Line_Other": "&#x1f683;",
      "Railroad": "",
      "Road": "",
      "Canal": "&#x1f6a2;",
      "Water_Route": "&#x1f6a2;",
      "Tunnel": "",
      "Bridge": "&#x1f309;",
      "Product": "",
      "Product_Other": "",
      "Material": "",
      "Clothing": "&#x1f455;",
      "Money_Form": "&#x1f4b0;",
      "Drug": "&#x1f48a;",
      "Weapon": "",
      "Stock": "",
      "Award": "",
      "Decoration": "",
      "Offence": "",
      "Service": "",
      "Character": "",
      "ID_Number": "",
      "Vehicle": "",
      "Vehicle_Other": "",
      "Car": "&#x1f697;",
      "Train": "&#x1f686;",
      "Aircraft": "&#x2708;",
      "Spaceship": "&#x1f6a2;",
      "Ship": "&#x1f6a2;",
      "Food": "&#x1f35a;",
      "Food_Other": "&#x1f35a;",
      "Dish": "&#x1f374;",//20190315 asd commit
    }
    let shapedSentence = sentence
    uniqueArr.forEach((obj) => {
      const form = obj.form
      const regex = new RegExp(form,'gu')
      const extended_class = obj.extended_class
      const emoji = emojiObj[extended_class] != null ? emojiObj[extended_class] : ""
      shapedSentence = sentence.replace(regex,form+emoji)
    });
    return shapedSentence
  }
  makeOji () {
    //data set
    const typeToEmoji = {
      "greeting":"&#128536;",
      "information-providing":"&#x2757;&#x2757;",
      "feedback":"&#128531;",
      "information-seeking":"&#x1f914;",
      "agreement":"&#x1f970;",
      "feedbackElicitation":"&#x1f60f;",
      "commissive":"&#x1f618;",
      "acceptOffer":"&#x1f929;",
      "selfCorrection":"&#x1f601;",
      "thanking":"&#x1f618; &#128149;",
      "apology":"&#x1f97a;",
      "stalling":"&#x1f627;",
      "directive":"&#x1f624;",
      "goodbye":"&#x1f61a;",
      "declineOffer":"&#x1f626;",
      "turnAssign":"&#x1f604;",
      "pausing":"&#x270b;",
      "acceptApology":"&#x1f60d;",
      "acceptThanking":"&#x1f970;"
    }

    let ojiSentence = ""
    let sentence
    this.analysisArr.forEach((obj) => {
      const type = obj.sentenceType.dialog_act[0]
      const uniqueArr = obj.unique
      const endEmoji = typeToEmoji[type]
      sentence = obj.sentence
      sentence = this.ShapedUniqueEmoji(sentence,uniqueArr)
      const endPoint = sentence.slice(-1)
      if(endPoint == "," || endPoint == "、" || endPoint == "." || endPoint == "。"){
        sentence = sentence.slice(0,-1)
      }
      ojiSentence = ojiSentence + sentence + endEmoji
    });

    return ojiSentence
  }
}

const ojisanCompiler = async (req,res) => {
  const obj = req.body
  if(obj.functionToken!="jv8rmvf8kd0c3j"){
    res.status(500).send("Server Error")
  }
  const token = obj.access_token
  const msg = obj.message
  const cotoha = new Cotoha(msg,token)
  await cotoha.parse()
  await cotoha.separateSentence()
  await cotoha.createAnalysis()
  //await cotoha.unique()//未実装
  const result = await cotoha.makeOji()

  const status = 200//prod
  res.status(status).json({message: result})//prod

  //console.log(result)//test
  //return result//test
}

//以下test
/*
const test = async () => {
  const request = {
    body: {
      functionToken: "jv8rmvf8kd0c3j",
      access_token: "****************************",
      message: "マイクロソフト者は今日もかっこいい"
    }
  }
  const res = ojisanCompiler(request)
  await res
  console.log(res)
  return res
}
test()
*/
//testここまで
