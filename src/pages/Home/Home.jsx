import { productsMock } from "../../mock/productsMock";
import ProductCard from '../../components/ProductCard/ProductCard';


function Home() {
    // const produtos = [
    //     { id: 1, nome: "Camiseta Boxy Heavyweight", preco: "R$ 149,90", tag: "NEW" },
    //     { id: 2, nome: "Moletom Oversized Black", preco: "R$ 299,90", tag: "PRE-ORDER" },
    //     { id: 3, nome: "Calça Denim Wide Leg", preco: "R$ 349,90", tag: "RESTOCK" },
    // ];

    return (
        <div className="home-page animate-fade-in">

            <h2 className="fs-1 fw-bold my-2 m-0 text-center tracking-wide">Bem-Vindo</h2>

            <section className="hero-section bg-black py-1 mb-5 d-flex align-items-center justify-content-center" style={{ background: '#f8f9fa' }}>
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className=""
                    style={{ width: '60vw', height: 'auto', top: 0, left: 0, zIndex: 1 }}
                >
                    <source src="/src/assets/video/video.mp4" type="video/mp4" />
                </video>
            </section>

            {/* 2. GRADE DE PRODUTOS */}
            <section className="container mb-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    {/* <h2 className="fs-4 fw-bold m-0 tracking-wide">LANÇAMENTOS</h2> */}
                </div>

                {/* <div className="row g-4">
                    {produtos.map((produto) => (
                        <div key={produto.id} className="col-12 col-md-4">
                            <div className="product-card border-0 position-relative">

                                <div className="bg-light d-flex align-items-center justify-content-center mb-3 position-relative" style={{ aspectRatio: '3/4', background: '#f1f1f1' }}>
                                    <span className="text-muted small fw-semibold">[IMAGEM DO PRODUTO]</span>
                                    <span className="position-absolute top-0 start-0 bg-dark text-white small px-2 py-1 m-3 fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                                        {produto.tag}
                                    </span>
                                </div>

                                <div className="product-info">
                                    <h3 className="fs-6 fw-bold text-dark m-0 mb-1">{produto.nome}</h3>
                                    <p className="text-secondary small m-0">{produto.preco}</p>
                                </div>

                            </div>
                        </div>
                    ))}
                </div> */}

                <div className="row g-5 justify-content-center">
                    {productsMock.map((item) => (
                        // col-12 (1 col no mobile) | col-md-6 (2 cols no desktop)
                        <div key={item.id} className="col-12 col-md-6">
                            <ProductCard produto={item} />
                        </div>
                    ))}
                </div>

            </section>

            {/* 3. MANIFESTO / DETALHE TÉCNICO */}
            {/* <section className="bg-dark text-white py-5 text-center">
                <div className="container py-4" style={{ maxWidth: '700px' }}>
                    <h3 className="fs-5 fw-bold mb-3 tracking-widest text-uppercase" style={{ color: '#8c8c8c' }}>O Conceito</h3>
                    <p className="m-0 lh-lg text-muted" style={{ fontSize: '15px' }}>
                        A ASYMMETRIC nasceu para desafiar as proporções tradicionais. Desenvolvemos peças independentes com tecidos de alta gramatura, garantindo caimento estruturado e durabilidade extrema para o dia a dia.
                    </p>
                </div>
            </section> */}

        </div>
    );
}

export default Home;