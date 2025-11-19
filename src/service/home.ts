import { http } from "@/lib/http";

interface LoginData {
  account: string;
  password: string;
}
const loginApi = (data: LoginData) => http.post("/login", data);

function urlLoginApi(token: string, userId: string) {
  return http.post(`/api/token/sso-login?token=${token}&userId=${userId}`);
}

export { loginApi, urlLoginApi };
