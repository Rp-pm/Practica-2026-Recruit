
/* =========================
   CHARACTER COUNTER
========================= */

const messageTextarea =
document.getElementById('message');

const remainingChars =
document.getElementById('remainingChars');

if(messageTextarea){

    const updateCounter = () => {

        remainingChars.textContent =
        250 - messageTextarea.value.length;
    };

    messageTextarea.addEventListener(
        'input',
        updateCounter
    );

    updateCounter();
}

/* =========================
   FORM SUBMIT
========================= */

const contactForm =
document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Mesaj trimis cu succes!');
    });
}

/* =========================
   DARK MODE ENGINE
========================= */

const themeToggle =
document.getElementById('themeToggle');

themeToggle.addEventListener(
    'click',
    () => {

        document.body.classList.toggle(
            'dark-theme'
        );

        if(
            document.body.classList.contains(
                'dark-theme'
            )
        ){
            themeToggle.innerHTML = '☀️';
        }
        else{
            themeToggle.innerHTML = '🌙';
        }
    }
);

/* =====================================================
   🧠 NEURAL TRACKING (Corecție și Optimizare)
===================================================== */

const neuralGlass = document.getElementById('neuralGlass');

if(neuralGlass){
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        // Rotație 3D (FĂRĂ translate(-50%,-50%) pentru că acum folosim bottom/right)
        neuralGlass.style.transform = `rotateX(${(-y * 20)}deg) rotateY(${(x * 20)}deg)`;

        // Glow tracking
        neuralGlass.style.filter = `drop-shadow(${x * 20}px ${y * 20}px 20px rgba(0,200,255,0.4))`;
    });

    // Resetare la ieșirea mouse-ului
    document.addEventListener('mouseleave', () => {
        neuralGlass.style.transform = `rotateX(0deg) rotateY(0deg)`;
        neuralGlass.style.filter = `none`;
    });
}

// Logică pentru trimiterea formularului securizat
const accessForm = document.getElementById('accessForm');

if(accessForm) {
    accessForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Efect vizual de "Sistem deblocat"
        const btn = e.target.querySelector('.security-form__button');
        btn.textContent = "ACCESS GRANTED";
        btn.style.background = "#fff";
        
        // Simulare redirect sau succes
        setTimeout(() => {
            alert("Neural Link Established. Welcome, Agent!");
            accessForm.reset();
            btn.textContent = "Initialize Link";
        }, 1000);
    });
}