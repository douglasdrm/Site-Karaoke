/* Lógica de JavaScript para Karaoke Party */

const urlJSON = "data/songs.json";
let todasMusicas = [];
let favoritos = JSON.parse(localStorage.getItem('karaoke_favoritos')) || [];
let filtroTexto = "";
let filtroIdioma = "";
let filtroLetra = "";
let paginaAtual = 1;
let itensPorPagina = 25;

document.addEventListener('DOMContentLoaded', function () {
    // Inicialização da Tabela de Músicas
    if (document.getElementById("tabelaMusicas")) {
        console.log("Tentando carregar músicas de:", urlJSON);
        fetch(urlJSON)
            .then(res => {
                if (!res.ok) throw new Error("Erro ao carregar o arquivo JSON: " + res.status);
                return res.json();
            })
            .then(data => {
                console.log("JSON carregado com sucesso. Total de músicas:", data.musicas ? data.musicas.length : 0);
                todasMusicas = data.musicas || [];

                if (todasMusicas.length === 0) {
                    console.warn("A lista de músicas está vazia.");
                    return;
                }

                // Ordena por artista e depois por título
                todasMusicas.sort((a, b) => {
                    const artistaA = (a.artista || "").toUpperCase();
                    const artistaB = (b.artista || "").toUpperCase();
                    if (artistaA < artistaB) return -1;
                    if (artistaA > artistaB) return 1;
                    const tituloA = (a.titulo || "").toUpperCase();
                    const tituloB = (b.titulo || "").toUpperCase();
                    if (tituloA < tituloB) return -1;
                    if (tituloA > tituloB) return 1;
                    return 0;
                });

                if (data.fileInfo?.version) {
                    const dataFormatada = formatarData(data.fileInfo.version);
                    const dataDiv = document.getElementById("dataAtualizacao");
                    if (dataDiv) dataDiv.textContent = `🔄 Atualizado em: ${dataFormatada}`;
                }

                gerarMenuLetras();
                carregarTabela();
            })
            .catch(err => {
                console.error("Erro detalhado ao carregar JSON:", err);
                const tabela = document.querySelector("#tabelaMusicas tbody");
                if (tabela) {
                    tabela.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding:20px;">
                        Erro ao carregar a lista de músicas.<br>
                        Certifique-se de que está usando um servidor local (como Live Server) ou que o arquivo <strong>data/songs.json</strong> existe.<br>
                        <small>${err.message}</small>
                    </td></tr>`;
                }
            });
    }

    // Event Listeners
    const buscaInput = document.getElementById("busca");
    if (buscaInput) {
        buscaInput.addEventListener("input", (e) => {
            filtroTexto = e.target.value.toLowerCase();
            paginaAtual = 1;
            carregarTabela();
        });
    }

    const idiomaSelect = document.getElementById("idiomaFiltro");
    if (idiomaSelect) {
        idiomaSelect.addEventListener("change", (e) => {
            filtroIdioma = e.target.value;
            paginaAtual = 1;
            carregarTabela();
        });
    }

    const itensSelect = document.getElementById("itensPorPagina");
    if (itensSelect) {
        itensSelect.addEventListener("change", (e) => {
            itensPorPagina = parseInt(e.target.value);
            paginaAtual = 1;
            carregarTabela();
        });
    }

    // Scroll to Top logic
    const scrollTopBtn = document.getElementById("scrollTop");
    window.addEventListener("scroll", () => {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add("visible");
        } else {
            scrollTopBtn.classList.remove("visible");
        }
    });

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Filtro de Favoritos
    const btnFav = document.getElementById("btnVerFavoritos");
    if (btnFav) {
        btnFav.addEventListener("click", () => {
            const isShowingFavs = btnFav.classList.toggle("bg-fuchsia-600");
            btnFav.classList.toggle("bg-gray-800", !isShowingFavs);
            const txt = document.getElementById("txtFavoritos");
            txt.textContent = isShowingFavs ? "Ver Todas" : "Meus Favoritos";

            mostrarApenasFavoritos = isShowingFavs;
            paginaAtual = 1;
            carregarTabela();
        });
    }
});

let mostrarApenasFavoritos = false;

function formatarData(version) {
    if (!version || version.length < 8) return version;
    const ano = version.substring(0, 4);
    const mes = version.substring(4, 6);
    const dia = version.substring(6, 8);
    return `${dia}/${mes}/${ano}`;
}

function gerarMenuLetras() {
    const menu = document.getElementById("menuLetras");
    if (!menu) return;

    const letras = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    let html = `<button class="letra-btn ${filtroLetra === '' ? 'active' : ''}" onclick="filtrarPorLetra('')">TUDO</button>`;

    letras.forEach(l => {
        html += `<button class="letra-btn ${filtroLetra === l ? 'active' : ''}" onclick="filtrarPorLetra('${l}')">${l}</button>`;
    });

    menu.innerHTML = html;
}

function filtrarPorLetra(letra) {
    filtroLetra = letra;
    paginaAtual = 1;

    // Atualiza classe ativa
    document.querySelectorAll(".letra-btn").forEach(btn => {
        btn.classList.toggle("active", btn.textContent === (letra || "TUDO"));
    });

    carregarTabela();
}

function carregarTabela() {
    const tbody = document.querySelector("#tabelaMusicas tbody");
    if (!tbody) return;

    const filtradas = todasMusicas.filter(m => {
        const matchTexto = (m.artista || "").toLowerCase().includes(filtroTexto) ||
            (m.titulo || "").toLowerCase().includes(filtroTexto) ||
            (m.codigo || "").toString().includes(filtroTexto);

        const matchIdioma = filtroIdioma === "" || m.idioma === filtroIdioma;

        const matchFav = !mostrarApenasFavoritos || favoritos.includes(m.codigo);

        let matchLetra = true;
        if (filtroLetra !== "") {
            const primeiraLetra = (m.artista || "").charAt(0).toUpperCase();
            if (filtroLetra === "#") {
                matchLetra = !/[A-Z]/.test(primeiraLetra);
            } else {
                matchLetra = primeiraLetra === filtroLetra;
            }
        }

        return matchTexto && matchIdioma && matchLetra && matchFav;
    });

    const totalItens = filtradas.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPagina);
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const musicasPagina = filtradas.slice(inicio, fim);

    tbody.innerHTML = "";

    if (musicasPagina.length === 0) {
        const msg = mostrarApenasFavoritos ? "Você ainda não tem músicas favoritas" : "Nenhuma música encontrada";
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500 italic">${msg}</td></tr>`;
    } else {
        musicasPagina.forEach(m => {
            const isFav = favoritos.includes(m.codigo);
            const tr = document.createElement("tr");

            const numeroWhatsApp = "5511999999999"; // Substituir conforme necessário
            const mensagem = encodeURIComponent(`🎤 Pedido de Música\n\nCódigo: ${m.codigo}\nMúsica: ${m.titulo}\nArtista: ${m.artista}\n\nNome do cantor: `);
            const linkWA = `https://wa.me/${numeroWhatsApp}?text=${mensagem}`;

            tr.innerHTML = `
                <td data-label="CÓDIGO" class="col-codigo">${m.codigo}</td>
                <td data-label="ARTISTA / TÍTULO">
                    <div class="font-semibold text-white uppercase">${m.artista}</div>
                    <div class="text-gray-400 text-xs italic mt-1">${m.titulo}</div>
                </td>
                <td data-label="LETRA" class="text-gray-400 text-sm italic">${m.inicioletra || '-'}</td>
                <td class="text-center">
                    <div class="flex justify-center items-center gap-3">
                        <i class="fas fa-star star-btn ${isFav ? 'active' : ''}" onclick="toggleFavorito('${m.codigo}', this)"></i>
                        <a href="${linkWA}" target="_blank" class="bg-primary hover:bg-accent text-white p-2 rounded-lg transition-colors inline-block leading-none">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    gerarPaginacao(totalItens);
}

function toggleFavorito(codigo, el) {
    const idx = favoritos.indexOf(codigo);
    if (idx > -1) {
        favoritos.splice(idx, 1);
        el.classList.remove('active');
    } else {
        favoritos.push(codigo);
        el.classList.add('active');
    }
    localStorage.setItem('karaoke_favoritos', JSON.stringify(favoritos));
}

function gerarPaginacao(total) {
    const pagDiv = document.getElementById("paginacao");
    if (!pagDiv) return;

    const totalPaginas = Math.ceil(total / itensPorPagina);
    if (totalPaginas <= 1) {
        pagDiv.innerHTML = "";
        return;
    }

    let html = "";
    const maxVisible = 5;
    let start = Math.max(1, paginaAtual - 2);
    let end = Math.min(totalPaginas, start + maxVisible - 1);

    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

    // Botão Anterior
    html += `<button ${paginaAtual === 1 ? 'disabled' : ''} onclick="mudarPagina(${paginaAtual - 1})"><i class="fas fa-chevron-left"></i></button>`;

    for (let i = start; i <= end; i++) {
        html += `<button class="${i === paginaAtual ? 'active' : ''}" onclick="mudarPagina(${i})">${i}</button>`;
    }

    // Botão Próximo
    html += `<button ${paginaAtual === totalPaginas ? 'disabled' : ''} onclick="mudarPagina(${paginaAtual + 1})"><i class="fas fa-chevron-right"></i></button>`;

    pagDiv.innerHTML = html;
}

function mudarPagina(p) {
    paginaAtual = p;
    carregarTabela();
    // Scroll suave para o topo da tabela
    const filtrosEl = document.getElementById("filtros");
    if (filtrosEl) {
        window.scrollTo({ top: filtrosEl.offsetTop - 100, behavior: 'smooth' });
    }
}

function sugerirMusica() {
    if (!todasMusicas.length) return;
    const aleatoria = todasMusicas[Math.floor(Math.random() * todasMusicas.length)];
    mostrarSugestao(aleatoria);
}

function sugerirMusicaPorIdioma(idioma) {
    const filtradas = todasMusicas.filter(m => m.idioma === idioma);
    if (!filtradas.length) return;
    const aleatoria = filtradas[Math.floor(Math.random() * filtradas.length)];
    mostrarSugestao(aleatoria);
}

function mostrarSugestao(m) {
    const div = document.getElementById("sugestao");
    const containerAcoes = document.getElementById("acoesSugestao");
    const btnWA = document.getElementById("botaoWhatsapp");
    const btnFav = document.getElementById("btnFavoritoSugestao");

    if (!div) return;

    div.classList.remove('animate-pulse');
    void div.offsetWidth; // trigger reflow
    div.classList.add('animate-pulse');

    // Novo layout de 3 linhas solicitado pelo usuário - Diferenciação Total
    // Novo layout de 3 linhas - Estilo Premium sem conflitos
    div.innerHTML = `
        <div class="flex flex-col items-center gap-1">
            <span class="text-white/40 text-[0.65rem] tracking-[0.5em] font-bold mb-2">SUGESTÃO</span>
            <span class="text-white text-xl md:text-2xl font-bold uppercase tracking-tight mb-1" style="color: white !important;">${m.artista}</span>
            <span class="text-fuchsia-500 text-4xl md:text-6xl font-black italic tracking-tighter leading-none drop-shadow-[0_0_20px_rgba(217,70,239,0.4)]" style="color: #d946ef !important;">${m.titulo}</span>
            <div class="mt-5">
                <span class="text-[#00f2ff] text-4xl md:text-5xl font-black tracking-[0.2em] drop-shadow-[0_0_15px_rgba(0,242,255,0.6)]" style="color: #00f2ff !important;">${m.codigo}</span>
            </div>
        </div>
    `;

    if (containerAcoes) {
        containerAcoes.classList.remove("hidden");
        
        // Configura WhatsApp
        if (btnWA) {
            const mensagem = encodeURIComponent(`🎤 Pedido de Música\n\nCódigo: ${m.codigo}\nMúsica: ${m.titulo}\nArtista: ${m.artista}\n\nNome do cantor: `);
            btnWA.href = `https://wa.me/5511999999999?text=${mensagem}`;
        }

        // Configura Favorito na Sugestão
        if (btnFav) {
            const isFav = favoritos.includes(m.codigo);
            btnFav.querySelector('i').className = isFav ? "fas fa-star text-yellow-400 text-xl" : "far fa-star text-white text-xl";
            
            btnFav.onclick = () => {
                toggleFavorito(m.codigo, null);
                const novoIsFav = favoritos.includes(m.codigo);
                btnFav.querySelector('i').className = novoIsFav ? "fas fa-star text-yellow-400 text-xl" : "far fa-star text-white text-xl";
                
                // Atualiza a tabela se estiver visível para refletir a mudança
                carregarTabela();
            };
        }
    }
}
