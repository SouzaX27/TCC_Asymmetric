import { Link } from 'react-router-dom';

const documentos = {
    termos: {
        titulo: 'Termos de Uso',
        secoes: [
            {
                titulo: 'Sobre a aplicação',
                texto: 'Esta loja faz parte de um projeto acadêmico. As funções de conta, catálogo, carrinho e pedidos são demonstrativas e não substituem uma operação comercial completa.'
            },
            {
                titulo: 'Conta e segurança',
                texto: 'Informe dados corretos ao criar sua conta e mantenha sua senha em sigilo. A equipe da aplicação nunca deve solicitar sua senha por e-mail ou mensagem.'
            },
            {
                titulo: 'Pedidos e pagamentos',
                texto: 'O pagamento apresentado nesta versão é fictício. Nenhum valor é cobrado. A confirmação demonstrativa registra o pedido e atualiza o estoque e o cupom no ambiente de teste.'
            },
            {
                titulo: 'Uso responsável',
                texto: 'Não tente acessar contas, dados ou recursos de outras pessoas, nem interferir no funcionamento da aplicação.'
            },
            {
                titulo: 'Versão',
                texto: 'Versão 1.0. Estes termos devem ser revisados e ajustados antes de qualquer uso comercial.'
            }
        ]
    },
    privacidade: {
        titulo: 'Política de Privacidade',
        secoes: [
            {
                titulo: 'Dados tratados',
                texto: 'No cadastro são solicitados nome, e-mail e telefone. Durante uma compra demonstrativa podem ser tratados endereço de entrega, CEP, itens, quantidades, cupom e valores do pedido.'
            },
            {
                titulo: 'Finalidades',
                texto: 'Os dados são usados para criar e manter a conta, processar o pedido demonstrativo, calcular o frete e apresentar o histórico de compras associado à conta.'
            },
            {
                titulo: 'Serviços externos',
                texto: 'A consulta de CEP pode enviar o CEP informado ao ViaCEP. A cotação de frete pode compartilhar CEP e dimensões dos itens com o Melhor Envio. O gateway fictício recebe apenas o valor e uma referência aleatória do pagamento, sem nome, e-mail ou telefone.'
            },
            {
                titulo: 'Armazenamento e segurança',
                texto: 'Os dados da conta e dos pedidos são mantidos pelo backend. O navegador mantém somente identificadores de produto, variação, tamanho e quantidade do carrinho no armazenamento local. Os dados do checkout ficam temporariamente na sessão do navegador e são removidos após a confirmação. O token de renovação fica em cookie HttpOnly; o token de acesso permanece em memória.'
            },
            {
                titulo: 'Seus direitos e contato',
                texto: 'Para solicitar acesso, correção ou exclusão dos dados desta aplicação, entre em contato pelo endereço suporte.asymmetric@gmail.com. A retenção deve observar obrigações legais aplicáveis.'
            },
            {
                titulo: 'Versão',
                texto: 'Versão 1.0. Este texto é uma base informativa para o projeto acadêmico e precisa de revisão jurídica antes de uso comercial.'
            }
        ]
    }
};

function LegalDocument({ tipo }) {
    const documento = documentos[tipo] || documentos.termos;

    return (
        <main className="container my-5 pt-5">
            <article className="mx-auto" style={{ maxWidth: '820px' }}>
                <h1 className="fw-bold text-uppercase mb-4">{documento.titulo}</h1>
                <p className="text-muted">Documento demonstrativo, versão 1.0.</p>
                {documento.secoes.map((secao) => (
                    <section key={secao.titulo} className="mb-4">
                        <h2 className="fs-4 fw-bold">{secao.titulo}</h2>
                        <p>{secao.texto}</p>
                    </section>
                ))}
                <Link to="/cadastro" className="button-2 d-inline-block px-4 py-2 fw-bold text-uppercase text-decoration-none">
                    Voltar ao cadastro
                </Link>
            </article>
        </main>
    );
}

export default LegalDocument;