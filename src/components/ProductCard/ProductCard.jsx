import './ProductCard.css';

function ProductCard({produto}) {

    const formatarPreco = (valor) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="card " style={{width: '100%' }}>
    <img src={produto.imagem} className="card-img-top" alt={produto.nome}/>
    <div className="card-body">
        <p className="card-title fw-bold fs-4">{produto.nome}</p>
        <p className="card-text fs-4">{formatarPreco(produto.preco)}</p>
    </div>
</div>

    );
};

export default ProductCard;