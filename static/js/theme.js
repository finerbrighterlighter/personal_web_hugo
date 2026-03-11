(function(){

    const root = document.documentElement
    const toggle = document.getElementById("theme-toggle")
    
    function updateIcon(){
        if(root.dataset.theme === "dark"){
            toggle.textContent = "☀️"
        } else {
            toggle.textContent = "🌙"
        }
    }
    
    const saved = localStorage.getItem("theme")
    
    if(saved){
        root.dataset.theme = saved
    }
    
    updateIcon()
    
    toggle.addEventListener("click", function(){
    
        if(root.dataset.theme === "dark"){
            root.dataset.theme = "light"
            localStorage.setItem("theme","light")
        } else {
            root.dataset.theme = "dark"
            localStorage.setItem("theme","dark")
        }
    
        updateIcon()
    
    })
    
    })();