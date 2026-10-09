const modal = document.querySelector('.txt-modal');
const btnFechar = modal.querySelector('button');

modal.showModal();

btnFechar.addEventListener('click', () => {
    modal.close();
});

modal.addEventListener('click', (e) => {
    const r = modal.getBoundingClientRect();

    const tela =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;

    if (!tela) modal.close();
});

const personagem = document.querySelector('.reactive');

let svg;
let golem;
let cabeca;
let olhos = [];

async function carregarGolem() {
    try {
        const resposta = await fetch('svg/golem.svg');

        if (!resposta.ok) {
            throw new Error(`Erro ao carregar SVG: ${resposta.status}`);
        }

        const texto = await resposta.text();

        const documento = new DOMParser().parseFromString(
            texto,
            'image/svg+xml'
        );

        if (documento.querySelector('parsererror')) {
            throw new Error('Não foi possível interpretar o SVG.');
        }

        svg = document.importNode(
            documento.documentElement,
            true
        );

        svg.classList.add('golem-svg');
        svg.setAttribute('draggable', 'false');

        personagem.replaceChildren(svg);

        golem = svg.querySelector('#golem');
        cabeca = svg.querySelector('#head');

        if (!golem) {
            throw new Error('O grupo #golem não foi encontrado.');
        }

        configurarPersonagem();
        configurarPiscar(svg);

    } catch (erro) {
        console.error('Erro ao carregar o golem:', erro);
    }
}

function configurarPersonagem() {
    personagem.style.position = 'absolute';
    personagem.style.width = 'min(45vw, 320px)';
    personagem.style.height = 'min(45vh, 320px)';
    personagem.style.left = '50%';
    personagem.style.top = '50%';

    personagem.style.transform =
        'translate(calc(-50% + 0px), calc(-50% + 0px))';

    personagem.style.cursor = 'grab';
    personagem.style.touchAction = 'none';
    personagem.style.userSelect = 'none';
    personagem.style.webkitUserSelect = 'none';

    svg.style.display = 'block';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.overflow = 'visible';
    svg.style.pointerEvents = 'none';
    svg.style.transformOrigin = '50% 85%';

    personagem.style.pointerEvents = 'auto';

    svg.style.willChange = 'transform';
}

function configurarPiscar(svg) {
    const olhos = svg.querySelectorAll(
        '[data-original-path-index="865"], ' +
        '[data-original-path-index="866"]'
    );

    if (olhos.length !== 2) {
        console.warn('Não foi possível localizar os dois olhos.');
        return;
    }

    olhos.forEach((olho) => {
        olho.style.transformBox = 'fill-box';
        olho.style.transformOrigin = 'center';
    });

    function piscar() {
        olhos.forEach((olho) => {
            olho.animate(
                [
                    { transform: 'scaleY(1)' },
                    { transform: 'scaleY(0.08)', offset: 0.45 },
                    { transform: 'scaleY(1)' }
                ],
                {
                    duration: 180,
                    easing: 'ease-in-out'
                }
            );
        });

        const proximoPiscar = 1800 + Math.random() * 3200;
        setTimeout(piscar, proximoPiscar);
    }

    setTimeout(piscar, 1200);
}

let terremotoAtivo = false;
let temporizadorTerremoto = null;

function iniciarTerremoto() {
    if (!svg || terremotoAtivo) return;

    terremotoAtivo = true;

    svg.classList.remove('terremoto');

    void svg.offsetWidth;

    svg.classList.add('terremoto');

    clearTimeout(temporizadorTerremoto);

    temporizadorTerremoto = setTimeout(() => {
        svg.classList.remove('terremoto');
        terremotoAtivo = false;
    }, 1400);
}

let arrastando = false;
let iniciouArraste = false;

let ponteiroInicialX = 0;
let ponteiroInicialY = 0;

let deslocamentoX = 0;
let deslocamentoY = 0;

let posicaoInicialX = 0;
let posicaoInicialY = 0;

const distanciaMinima = 6;

function iniciarInteracao(e) {
    if (!svg) return;

    if (e.pointerType === 'mouse' && e.button !== 0) {
        return;
    }

    e.preventDefault();

    arrastando = true;
    iniciouArraste = false;

    ponteiroInicialX = e.clientX;
    ponteiroInicialY = e.clientY;

    posicaoInicialX = deslocamentoX;
    posicaoInicialY = deslocamentoY;

    personagem.style.cursor = 'grabbing';

    personagem.setPointerCapture(e.pointerId);
}

function moverInteracao(e) {
    if (!arrastando) return;

    const movimentoX = e.clientX - ponteiroInicialX;
    const movimentoY = e.clientY - ponteiroInicialY;

    if (!iniciouArraste) {
        const distancia = Math.hypot(
            movimentoX,
            movimentoY
        );

        if (distancia < distanciaMinima) return;

        iniciouArraste = true;
    }

    deslocamentoX = posicaoInicialX + movimentoX;
    deslocamentoY = posicaoInicialY + movimentoY;

    limitarPosicao();
    atualizarPosicao();
}

function finalizarInteracao(e) {
    if (!arrastando) return;

    arrastando = false;

    personagem.style.cursor = 'grab';

    if (personagem.hasPointerCapture(e.pointerId)) {
        personagem.releasePointerCapture(e.pointerId);
    }

    if (!iniciouArraste) {
        iniciarTerremoto();
    }

    iniciouArraste = false;
}

function limitarPosicao() {
    const largura = personagem.offsetWidth;
    const altura = personagem.offsetHeight;

    const larguraTela = window.innerWidth;
    const alturaTela = window.innerHeight;

    const margem = 20;

    const centroX = larguraTela / 2;
    const centroY = alturaTela / 2;

    const limiteEsquerdo =
        margem - centroX + largura / 2;

    const limiteDireito =
        larguraTela - margem - centroX - largura / 2;

    const limiteSuperior =
        margem - centroY + altura / 2;

    const limiteInferior =
        alturaTela - margem - centroY - altura / 2;

    deslocamentoX = Math.max(
        limiteEsquerdo,
        Math.min(limiteDireito, deslocamentoX)
    );

    deslocamentoY = Math.max(
        limiteSuperior,
        Math.min(limiteInferior, deslocamentoY)
    );
}

function atualizarPosicao() {
    personagem.style.transform =
        `translate(calc(-50% + ${deslocamentoX}px), ` +
        `calc(-50% + ${deslocamentoY}px))`;
}

personagem.addEventListener(
    'pointerdown',
    iniciarInteracao
);

personagem.addEventListener(
    'pointermove',
    moverInteracao
);

personagem.addEventListener(
    'pointerup',
    finalizarInteracao
);

personagem.addEventListener(
    'pointercancel',
    finalizarInteracao
);

carregarGolem();

function iniciarFolhas() {
    const folhas = document.querySelector('.folhas');

    if (!folhas) return;

    const quantidade = 8;

    for (let i = 0; i < quantidade; i++) {
        const folha = document.createElement('div');
        const imagem = document.createElement('img');

        folha.classList.add('folha');

        imagem.src = 'svg/folha.svg';
        imagem.alt = '';
        imagem.draggable = false;

        folha.appendChild(imagem);

        folha.style.left = `${Math.random() * 100}%`;

        folha.style.setProperty(
            '--tamanho',
            `${14 + Math.random() * 14}px`
        );

        folha.style.setProperty(
            '--duracao',
            `${12 + Math.random() * 10}s`
        );

        folha.style.setProperty(
            '--atraso',
            `${-Math.random() * 20}s`
        );

        folhas.appendChild(folha);
    }
}

iniciarFolhas();