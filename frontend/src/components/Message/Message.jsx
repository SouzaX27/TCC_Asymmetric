function Message({ tipo = 'sucesso', texto }) {
    if (!texto) return null;

    const corTexto = tipo === 'sucesso' ? 'text-success' : 'text-danger';

    return (
        <small className={`mt-2 d-block fw-semibold ${corTexto}`}>
            {texto}
        </small>
    );
}

export default Message;