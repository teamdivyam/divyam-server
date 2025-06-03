const apiURL = "https://a2x5h6gnu44ruzafpw5nn633ii0yysdn.lambda-url.ap-south-1.on.aws";

const init = async () => {
    try {
        const res = await fetch(apiURL, {
            method: "POST",
        });

        const data = await res.json();
        console.log(data)
    } catch (err) {

        console.log(err)
    }
}

init()