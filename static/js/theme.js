(function(){

const root = document.documentElement
const toggle = document.getElementById("theme-toggle")

function getCurrentTheme(){

    if(root.dataset.theme){
        return root.dataset.theme
    }

    if(window.matchMedia("(prefers-color-scheme: dark)").matches){
        return "dark"
    }

    return "light"
}

function updateIcon(){
    const theme = getCurrentTheme()
    toggle.textContent = theme === "dark" ? "☀️" : "🌙"
}

const saved = localStorage.getItem("theme")

if(saved){
    root.dataset.theme = saved
}

updateIcon()

toggle.addEventListener("click", function(){

    const current = getCurrentTheme()

    const next = current === "dark" ? "light" : "dark"

    root.dataset.theme = next
    localStorage.setItem("theme", next)

    updateIcon()

})

})();
