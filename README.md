# Portfólio Pessoal

Este repositório contém o código-fonte do meu portfólio como desenvolvedor web. O objetivo principal foi criar uma aplicação clara, funcional e responsiva, que servisse como vitrine para os meus projetos e como exercício prático de organização de múltiplas aplicações em ambiente de produção.

## Tecnologias e Estrutura

A interface do portfólio foi desenvolvida com **React** e **Tailwind CSS**, utilizando **React Router** para gerenciar as rotas de forma fluida (SPA). A aplicação principal apresenta páginas para introdução, sobre mim, projetos e contato, e cada uma delas é carregada dinamicamente sem recarregamento da página.

Além da interface, o projeto envolve a configuração de um servidor **Node.js com Express**, responsável por servir diferentes aplicações por subdomínios. Foram utilizados os pacotes `vhost` e `http-proxy-middleware` para gerenciar essa distribuição entre projetos.

Os projetos exibidos no portfólio são acessados através de subdomínios como:

- `portfolio.brunoazvd.com`
- `sistema-escolar.brunoazvd.com`
- `tmdb-search.brunoazvd.com`
- `recortar-imagens.brunoazvd.com`
- `preencher-atividades.brunoazvd.com`
- `rplace.brunoazvd.com`

Cada um desses projetos é independente e servido como aplicação estática ou via proxy para backends dedicados.

## Deploy e Infraestrutura

O portfólio e os projetos relacionados estão hospedados em uma VPS (Ubuntu 24.04), com gerenciamento de processos feito via **PM2**. A comunicação segura é garantida com **HTTPS** via **Let's Encrypt** e configuração manual do **Certbot**.

Além disso, foi aplicada uma política de segurança com o middleware **Helmet**, configurando uma Content Security Policy personalizada para cada subdomínio.

## Considerações

Este projeto me permitiu exercitar tanto o desenvolvimento de interfaces modernas quanto a parte de infraestrutura: deploy, roteamento, configuração de servidores e segurança. Também me ajudou a integrar múltiplos projetos de forma centralizada, o que foi um desafio técnico relevante, especialmente no gerenciamento de caminhos, subdomínios e certificados.
