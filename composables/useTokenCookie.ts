export const useTokenCookie = () => {

    const token = useCookie("token");
    token.value = "123";

    const setCookie = () => {
        useCookie("token", {
            maxAge: 90
        }).value = Date.now().toString();
    };

    const getCookie = () => {
        return token.value;
    };

    return {
        setCookie,
        getCookie,
    };
};
