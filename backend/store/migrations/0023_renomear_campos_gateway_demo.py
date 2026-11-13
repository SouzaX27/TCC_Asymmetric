from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0022_pagamentodemonstracao_gateway'),
    ]

    operations = [
        migrations.RenameField(
            model_name='pagamentodemonstracao',
            old_name='gateway_payment_id',
            new_name='id_pagamento_gateway',
        ),
        migrations.RenameField(
            model_name='pagamentodemonstracao',
            old_name='checkout_url',
            new_name='url_checkout',
        ),
    ]