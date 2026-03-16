import { TipoTransacao } from "./TipoTransacao.js";
let saldo = JSON.parse(localStorage.getItem("saldo")) || 0;
// Se existem dados no localStorage, salva na lista de transacoes, senão salva uma lista vazia []
const transacoes = JSON.parse(localStorage.getItem('transacoes'), (key, value) => {
    if (key === 'data') {
        return new Date(value);
    }
    return value;
}) || [];
function debitar(valor) {
    if (valor <= 0) {
        throw new Error("O valor a ser debitado deve ser maior que zero!");
    }
    if (valor > saldo) {
        throw new Error("Saldo insuficiente :(");
    }
    saldo -= valor;
    localStorage.setItem("saldo", saldo.toString());
}
function depositar(valor) {
    if (valor <= 0) {
        throw new Error("O valor a ser depositado deve ser maior que zero!");
    }
    saldo += valor;
    localStorage.setItem("saldo", saldo.toString());
}
const Conta = {
    getSaldo() {
        return saldo;
    },
    getDataAcesso() {
        return new Date();
    },
    /*
    ! IMPORTANTE
    A função, sempre quando chamada, irá copiar as transacoes do localStorage e em seguida reodernar ela em ordem decrescente, salvando cada instância dela no grupoTransacoes que foi inicializado com uma ARRAY VAZIA!!.
    */
    getGruposTransacoes() {
        const GruposTransacoes = [];
        const listaTransacoes = structuredClone(transacoes);
        // Ordenação decrescente das datas
        const transacoesOrdenadas = listaTransacoes.sort((t1, t2) => t2.data.getTime() - t1.data.getTime());
        let labelAtualGrupoTransacao = "";
        for (let transacao of transacoesOrdenadas) {
            let labelGrupoTransacao = transacao.data.toLocaleDateString("pt-br", { month: "long", year: "numeric" });
            if (labelAtualGrupoTransacao != labelGrupoTransacao) {
                labelAtualGrupoTransacao = labelGrupoTransacao;
                GruposTransacoes.push({
                    label: labelGrupoTransacao,
                    transacoes: []
                });
            }
            // Ao adicionar um novo grupo, sempre vamos ao último grupo da lista e ADICIONAMOS a nova transação à lista de transações deste grupo
            GruposTransacoes.at(-1).transacoes.push(transacao);
        }
        return GruposTransacoes;
    },
    registrarTransacao(novaTransacao) {
        if (novaTransacao.tipoTransacao === TipoTransacao.DEPOSITO) {
            depositar(novaTransacao.valor);
        }
        else if (novaTransacao.tipoTransacao === TipoTransacao.TRANSFERENCIA || novaTransacao.tipoTransacao === TipoTransacao.BOLETO) {
            debitar(novaTransacao.valor);
            // Deixa o valor negativo, indicando no extrato que o valor foi retirado e não adicionado na conta.
            novaTransacao.valor *= -1;
        }
        else {
            throw new Error("Tipo de transação é inválido!");
        }
        transacoes.push(novaTransacao);
        console.log(this.getGruposTransacoes());
        localStorage.setItem("transacoes", JSON.stringify(transacoes));
    }
};
export default Conta;
