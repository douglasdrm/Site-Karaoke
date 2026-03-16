/* Lógica de JavaScript Extraída de musicas.html */

const urlJSON = "data/songs.json"; // Apontando agora para o local
let todasMusicas = [];
let paginaAtual = 1;
let itensPorPagina = 25;
let letraSelecionada = "";

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

    // Configuração de Event Listeners para Filtros
    const buscaInput = document.getElementById("busca");
    if (buscaInput) {
        buscaInput.addEventListener("input", () => {
            paginaAtual = 1;
            carregarTabela();
        });
    }

    const idiomaFiltro = document.getElementById("idiomaFiltro");
    if (idiomaFiltro) {
        idiomaFiltro.addEventListener("change", () => {
            paginaAtual = 1;
            carregarTabela();
        });
    }

    const itensPorPaginaSelect = document.getElementById("itensPorPagina");
    if (itensPorPaginaSelect) {
        itensPorPaginaSelect.addEventListener("change", e => {
            itensPorPagina = parseInt(e.target.value);
            paginaAtual = 1;
            carregarTabela();
        });
    }

    // Lógica do Sugestor (Randomizer)
    setInterval(function () {
        const sugestao = document.getElementById("sugestao");
        const botao = document.getElementById("botaoWhatsapp");

        if (!sugestao || sugestao.innerText.trim() === "") return;

        const texto = sugestao.innerText.trim();
        const numeroWhatsApp = "5521967192554";

        const mensagem = encodeURIComponent(
            "🎤 Pedido de Música\n\n" +
            texto +
            "\n\nNome do cantor: "
        );

        if (botao) {
            botao.href = "https://wa.me/" + numeroWhatsApp + "?text=" + mensagem;
            botao.style.display = "inline-block";
        }
    }, 1000);

    // Animação da nota musical no footer
    const musicNote = document.querySelector('.fa-music');
    if (musicNote) {
        let rotation = 0;
        setInterval(() => {
            rotation += 5;
            musicNote.style.transform = `rotate(${rotation}deg)`;
        }, 100);
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Funções Auxiliares

function formatarData(versionStr) {
    const data = versionStr.substring(0, 8);
    const dia = data.substring(0, 2);
    const mes = data.substring(2, 4);
    const ano = data.substring(4, 8);
    return `${dia}/${mes}/${ano}`;
}

function gerarMenuLetras() {
    const container = document.getElementById("menuLetras");
    if (!container) return;
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    letras.unshift("#");
    container.innerHTML = "";

    letras.forEach(letra => {
        const btn = document.createElement("button");
        btn.textContent = letra;
        btn.classList.toggle("active", letra === letraSelecionada);
        btn.onclick = () => {
            letraSelecionada = letraSelecionada === letra ? "" : letra;
            paginaAtual = 1;
            carregarTabela();
            gerarMenuLetras();
        };
        container.appendChild(btn);
    });
}

function carregarTabela() {
    const buscaElement = document.getElementById("busca");
    const idiomaElement = document.getElementById("idiomaFiltro");

    const busca = buscaElement ? buscaElement.value.toLowerCase() : "";
    const idioma = idiomaElement ? idiomaElement.value : "";

    let filtradas = todasMusicas.filter(m => {
        const artistaMatch = letraSelecionada === "#"
            ? !/^[A-Z]/i.test(m.artista.charAt(0))
            : !letraSelecionada || m.artista.toUpperCase().startsWith(letraSelecionada);

        return (
            artistaMatch &&
            (!idioma || m.idioma === idioma) &&
            (
                m.titulo.toLowerCase().includes(busca) ||
                m.artista.toLowerCase().includes(busca) ||
                m.inicioletra.toLowerCase().includes(busca)
            )
        );
    });

    const tabela = document.querySelector("#tabelaMusicas tbody");
    if (!tabela) return;
    tabela.innerHTML = "";

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const paginaMusicas = filtradas.slice(inicio, fim);

    for (let m of paginaMusicas) {
        const tr = document.createElement("tr");
        const numeroWhatsApp = "5521967192554";
        const mensagem = encodeURIComponent(
            `🎤 Pedido de Música\n\nCódigo: ${m.codigo}\nMúsica: ${m.titulo}\nArtista: ${m.artista}\n\nNome do cantor: `
        );
        const link = `https://wa.me/${numeroWhatsApp}?text=${mensagem}`;

        tr.innerHTML = `
            <td data-label="Código">${m.codigo}</td>
            <td data-label="Artista">${m.artista}</td>
            <td data-label="Título">${m.titulo}</td>
            <td data-label="Letra">${m.inicioletra}</td>
            <td class="col-pedir" data-label="Pedir">
                <a href="${link}" target="_blank" class="btnPedido">
                    <i class="fa-brands fa-whatsapp"></i>
                </a>
            </td>
        `;
        tabela.appendChild(tr);
    }

    gerarPaginacao(filtradas.length);
}

function gerarPaginacao(total) {
    const paginacaoDiv = document.getElementById("paginacao");
    if (!paginacaoDiv) return;
    paginacaoDiv.innerHTML = "";

    const totalPaginas = Math.ceil(total / itensPorPagina);

    // Botão "Anterior"
    const btnAnterior = document.createElement("button");
    btnAnterior.innerHTML = '<i class="fa-solid fa-backward"></i>';
    btnAnterior.disabled = paginaAtual === 1;
    btnAnterior.onclick = () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            carregarTabela();
        }
    };
    paginacaoDiv.appendChild(btnAnterior);

    const maxBotoesVisiveis = 5;
    let inicio = Math.max(1, paginaAtual - Math.floor(maxBotoesVisiveis / 2));
    let fim = Math.min(totalPaginas, inicio + maxBotoesVisiveis - 1);

    if (fim - inicio < maxBotoesVisiveis - 1) {
        inicio = Math.max(1, fim - maxBotoesVisiveis + 1);
    }

    for (let i = inicio; i <= fim; i++) {
        const botao = document.createElement("button");
        botao.textContent = i;
        if (i === paginaAtual) {
            botao.classList.add("ativo");
        }
        botao.onclick = () => {
            paginaAtual = i;
            carregarTabela();
        };
        paginacaoDiv.appendChild(botao);
    }

    // Botão "Próxima"
    const btnProxima = document.createElement("button");
    btnProxima.innerHTML = '<i class="fa-solid fa-forward"></i>';
    btnProxima.disabled = (paginaAtual === totalPaginas || totalPaginas === 0);
    btnProxima.onclick = () => {
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            carregarTabela();
        }
    };
    paginacaoDiv.appendChild(btnProxima);
}

function sugerirMusica() {
    if (!todasMusicas.length) return;
    const aleatoria = todasMusicas[Math.floor(Math.random() * todasMusicas.length)];
    mostrarSugestao(aleatoria);
}

function sugerirMusicaPorIdioma(idioma) {
    const candidatas = todasMusicas.filter(m => m.idioma === idioma);
    if (!candidatas.length) {
        alert("Nenhuma música nesse idioma");
        return;
    }
    const aleatoria = candidatas[Math.floor(Math.random() * candidatas.length)];
    mostrarSugestao(aleatoria);
}

function mostrarSugestao(musica) {
    const sugestaoDiv = document.getElementById("sugestao");
    if (sugestaoDiv) {
        sugestaoDiv.innerHTML = `
            <strong>${musica.titulo}</strong><br>
            <em>${musica.artista}</em><br>
            Código: ${musica.codigo}
        `;
    }
}
