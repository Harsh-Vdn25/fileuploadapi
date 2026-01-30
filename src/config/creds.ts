const  getCred =(name:string)=>{
    if(!name)return null;
    const cred = process.env[name];
    if(!cred)return null;
    return cred;
}
export const Credentials = {
    JWT_SECRET: getCred("JWT_SECRET"),
    DIR_ADDR: getCred("DIR_ADDR")
}