from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0021_pagamentodemonstracao'),
    ]

    operations = [
        migrations.AddField(
            model_name='pagamentodemonstracao',
            name='gateway_payment_id',
            field=models.CharField(blank=True, max_length=36),
        ),
        migrations.AddField(
            model_name='pagamentodemonstracao',
            name='checkout_url',
            field=models.URLField(blank=True, max_length=500),
        ),
    ]