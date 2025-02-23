export default function generateOTP() {
   let code=Math.floor(Math.random()*900000)+100000;
   return code;
}