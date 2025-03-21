# Generated by Django 5.1.7 on 2025-03-19 12:58

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('eapp', '0006_comparisonlist'),
    ]

    operations = [
        migrations.CreateModel(
            name='RentalProduct',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('hourly_rate', models.DecimalField(decimal_places=2, max_digits=10)),
                ('daily_rate', models.DecimalField(decimal_places=2, max_digits=10)),
                ('is_available', models.BooleanField(default=True)),
                ('security_deposit', models.DecimalField(decimal_places=2, max_digits=10)),
                ('rental_terms', models.TextField()),
                ('product', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='eapp.product')),
            ],
        ),
        migrations.CreateModel(
            name='RentalBooking',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('start_datetime', models.DateTimeField()),
                ('end_datetime', models.DateTimeField()),
                ('status', models.CharField(choices=[('Pending', 'Pending'), ('Active', 'Active'), ('Completed', 'Completed'), ('Cancelled', 'Cancelled')], default='Pending', max_length=20)),
                ('total_cost', models.DecimalField(decimal_places=2, max_digits=10)),
                ('booking_date', models.DateTimeField(auto_now_add=True)),
                ('security_deposit_paid', models.BooleanField(default=False)),
                ('security_deposit_returned', models.BooleanField(default=False)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='eapp.customer')),
                ('rental_product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='eapp.rentalproduct')),
            ],
        ),
    ]
