# Generated by Django 4.2.5 on 2025-01-25 16:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('eapp', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='instructor',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='instructor',
            name='password',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='instructor',
            name='username',
            field=models.CharField(blank=True, max_length=100, null=True, unique=True),
        ),
    ]
