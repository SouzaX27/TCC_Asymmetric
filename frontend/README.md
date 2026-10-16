# TCC---Asymmetric
Trabalho de Conclusão de Curso - Gustavo, Marcos e David

## Pagamento demonstrativo por QR Code

Somente o serviço `demo-gateway` precisa ser hospedado. O frontend, o backend da loja e o SQLite podem continuar no computador da apresentação. O celular precisa de internet para abrir o QR hospedado; se a conexão ou o gateway falhar, o apresentador pode concluir a simulação pelo botão de contingência no computador. Nenhuma cobrança real é feita.

O gateway guarda cobranças em memória e as expira em 20 minutos. Ele não precisa de banco para a apresentação, mas use uma única instância e não reinicie o serviço enquanto houver um QR ativo. Reiniciar o gateway invalida cobranças ainda pendentes.

### Hospedar o gateway

No Render, crie um Web Service com a raiz `demo-gateway`, use `npm install` como comando de build e `npm start` como comando de inicialização. Configure:

- `SEGREDO_COMPARTILHADO`: segredo aleatório forte, compartilhado somente entre gateway e backend.
- `URL_PUBLICA`: URL HTTPS pública do serviço, por exemplo `https://asymmetric-demo-gateway.onrender.com`.

O gateway instala Axios como dependência e serve seu bundle localmente; a página do QR não depende de CDN.

### Preparar a apresentação

No `backend/.env`, configure `PAGAMENTOS_DEMO_ATIVOS=True`, `URL_GATEWAY_DEMO` com a URL HTTPS do gateway e `SEGREDO_GATEWAY_DEMO` com o mesmo valor de `SEGREDO_COMPARTILHADO`. Não coloque esse segredo em variáveis `VITE_*` nem no frontend.

Inicie o backend no computador com `cd backend && python manage.py migrate && python manage.py runserver 127.0.0.1:8000` e o frontend com `cd frontend && npm install && npm run dev`. Abra a loja no próprio computador. O QR abrirá o gateway público no celular; depois da confirmação, o backend local consulta o gateway e registra o pedido, baixa o estoque e consome o cupom.

Se o gateway ou a conexão externa não estiver disponível no dia, use **Confirmar no computador (contingência)**. Essa confirmação é apenas uma simulação local, mas cria o pedido e aplica as mesmas regras de estoque e cupom.
